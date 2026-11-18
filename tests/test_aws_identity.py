from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock

import httpx
import pytest

from app.services import aws_identity


def test_uses_session_credentials_and_reuses_unexpired_client(monkeypatch) -> None:
    audience = "https://example.test/aws/sqs"
    role = "arn:aws:iam::000000000000:role/test"
    token = MagicMock()
    token.text = "synthetic-token"
    http_client = MagicMock()
    http_client.return_value.__enter__.return_value.get.return_value = token
    sts = MagicMock()
    sts.__enter__.return_value.assume_role_with_web_identity.return_value = {
        "Credentials": {
            "AccessKeyId": "local-test-access-key",
            "SecretAccessKey": "local-test-secret",
            "SessionToken": "local-test-session",
            "Expiration": datetime.now(timezone.utc) + timedelta(minutes=15),
        }
    }
    sqs = MagicMock()
    factory = MagicMock(side_effect=[sts, sqs])
    monkeypatch.setattr(aws_identity.httpx, "Client", http_client)
    monkeypatch.setattr(aws_identity.boto3, "client", factory)
    monkeypatch.setattr(aws_identity, "_cached_client", None)
    monkeypatch.setattr(aws_identity, "_expires_at", aws_identity._expires_at)
    monkeypatch.setattr(aws_identity, "_cache_key", None)

    assert aws_identity.get_sqs_client("us-east-1", role, audience) is sqs
    assert aws_identity.get_sqs_client("us-east-1", role, audience) is sqs
    http_client.assert_called_once_with(timeout=2, trust_env=False)
    assert factory.call_count == 2
    assert factory.call_args.kwargs["aws_session_token"] == "local-test-session"
    sts.__enter__.return_value.assume_role_with_web_identity.assert_called_once_with(
        RoleArn=role,
        RoleSessionName="nicolas-hub-telemetry",
        WebIdentityToken="synthetic-token",
        DurationSeconds=900,
    )


def test_metadata_failure_uses_public_safe_exception(monkeypatch) -> None:
    client = MagicMock(side_effect=httpx.ConnectError("private diagnostic"))
    monkeypatch.setattr(aws_identity.httpx, "Client", client)
    with pytest.raises(aws_identity.TelemetryIdentityError, match="indisponível"):
        aws_identity.get_sqs_client("us-east-1", "different-role", "audience")
