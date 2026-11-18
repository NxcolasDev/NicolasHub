"""Exchange the Cloud Run service identity for short-lived AWS credentials."""

from datetime import datetime, timedelta, timezone
from threading import Lock

import boto3
import httpx
from botocore import UNSIGNED
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError

_METADATA_IDENTITY = (
    "http://metadata.google.internal/computeMetadata/v1/"
    "instance/service-accounts/default/identity"
)
_AWS_CONFIG = Config(connect_timeout=2, read_timeout=2, retries={"max_attempts": 1})
_refresh_lock = Lock()
_cached_client = None
_expires_at = datetime.min.replace(tzinfo=timezone.utc)
_cache_key: tuple[str, str, str] | None = None


class TelemetryIdentityError(RuntimeError):
    """Cloud Run could not assume the AWS role."""


def get_sqs_client(region: str, role: str | None, audience: str | None):
    if role is None or audience is None:
        return boto3.client("sqs", region_name=region, config=_AWS_CONFIG)

    global _cached_client, _expires_at, _cache_key
    key = (region, role, audience)
    with _refresh_lock:
        if (
            _cached_client is not None
            and _cache_key == key
            and _expires_at > datetime.now(timezone.utc) + timedelta(seconds=60)
        ):
            return _cached_client

        try:
            with httpx.Client(timeout=2, trust_env=False) as http:
                token = http.get(
                    _METADATA_IDENTITY,
                    params={"audience": audience},
                    headers={"Metadata-Flavor": "Google"},
                )
                token.raise_for_status()
            with boto3.client(
                "sts",
                region_name=region,
                config=_AWS_CONFIG.merge(Config(signature_version=UNSIGNED)),
            ) as sts:
                credentials = sts.assume_role_with_web_identity(
                    RoleArn=role,
                    RoleSessionName="nicolas-hub-telemetry",
                    WebIdentityToken=token.text.strip(),
                    DurationSeconds=900,
                )["Credentials"]
            expiration = credentials["Expiration"]
            client = boto3.client(
                "sqs",
                region_name=region,
                config=_AWS_CONFIG,
                aws_access_key_id=credentials["AccessKeyId"],
                aws_secret_access_key=credentials["SecretAccessKey"],
                aws_session_token=credentials["SessionToken"],
            )
        except (httpx.HTTPError, BotoCoreError, ClientError, KeyError):
            raise TelemetryIdentityError(
                "Federação da telemetria indisponível."
            ) from None

        _cached_client, _expires_at, _cache_key = client, expiration, key
        return client
