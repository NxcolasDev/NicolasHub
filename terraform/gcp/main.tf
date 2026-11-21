terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 7.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

locals {
  name = "nicolas-hub-${var.environment}"
  apis = toset([
    "artifactregistry.googleapis.com",
    "iam.googleapis.com",
    "run.googleapis.com",
    "secretmanager.googleapis.com",
  ])
  database_secrets = toset(["DATABASE_URL", "JWT_SECRET_KEY"])
  runtime_secrets  = toset(keys(var.secret_versions))
  api_env = merge(
    {
      APP_ENVIRONMENT     = "production"
      FRONTEND_ORIGINS    = join(",", var.frontend_origins)
      PUBLIC_REGISTRATION = tostring(var.public_registration)
    },
    var.aws_telemetry == null ? {} : {
      AWS_REGION                = var.aws_telemetry.region
      AWS_SQS_ROLE_ARN          = var.aws_telemetry.role_arn
      AWS_WEB_IDENTITY_AUDIENCE = var.aws_telemetry.audience
      SQS_QUEUE_URL             = var.aws_telemetry.queue_url
    },
  )
}

resource "google_project_service" "apis" {
  for_each           = local.apis
  service            = each.value
  disable_on_destroy = false
}

resource "google_artifact_registry_repository" "api" {
  location      = var.region
  repository_id = local.name
  format        = "DOCKER"
  depends_on    = [google_project_service.apis]
}

resource "google_service_account" "api" {
  account_id   = local.name
  display_name = "Nicolas Hub API e migração"
  depends_on   = [google_project_service.apis]
}

resource "google_secret_manager_secret" "runtime" {
  for_each  = local.runtime_secrets
  secret_id = "${local.name}-${lower(replace(each.key, "_", "-"))}"

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_iam_member" "runtime" {
  for_each  = local.runtime_secrets
  secret_id = google_secret_manager_secret.runtime[each.key].id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.api.email}"
}

resource "google_cloud_run_v2_job" "migrate" {
  count               = var.api_image == null ? 0 : 1
  name                = "${local.name}-migrate"
  location            = var.region
  deletion_protection = true

  template {
    template {
      service_account = google_service_account.api.email
      max_retries     = 0
      timeout         = "300s"

      containers {
        image   = var.api_image
        command = ["alembic"]
        args    = ["upgrade", "head"]

        env {
          name  = "APP_ENVIRONMENT"
          value = "production"
        }

        dynamic "env" {
          for_each = local.database_secrets
          content {
            name = env.value
            value_source {
              secret_key_ref {
                secret  = google_secret_manager_secret.runtime[env.value].secret_id
                version = var.secret_versions[env.value]
              }
            }
          }
        }
      }
    }
  }

  depends_on = [google_secret_manager_secret_iam_member.runtime]
}

resource "google_cloud_run_v2_service" "api" {
  count                = var.api_image == null ? 0 : 1
  name                 = local.name
  location             = var.region
  ingress              = "INGRESS_TRAFFIC_ALL"
  invoker_iam_disabled = var.public_api
  deletion_protection  = true

  template {
    service_account = google_service_account.api.email
    timeout         = "60s"

    scaling {
      min_instance_count = 0
      max_instance_count = 2
    }

    containers {
      image = var.api_image

      ports {
        container_port = var.container_port
      }

      dynamic "env" {
        for_each = local.api_env
        content {
          name  = env.key
          value = env.value
        }
      }

      dynamic "env" {
        for_each = local.runtime_secrets
        content {
          name = env.value
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.runtime[env.value].secret_id
              version = var.secret_versions[env.value]
            }
          }
        }
      }
    }
  }

  depends_on = [google_secret_manager_secret_iam_member.runtime]
}
