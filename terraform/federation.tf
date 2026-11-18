variable "google_service_account_subject" {
  description = "ID numérico da identidade Cloud Run. Null mantém a fila sem federação com o GCP."
  type        = string
  default     = null

  validation {
    condition     = var.google_service_account_subject == null ? true : can(regex("^[0-9]+$", var.google_service_account_subject))
    error_message = "Use o ID numérico exclusivo da conta de serviço Google Cloud."
  }
}

locals {
  telemetry_audience = "https://nicolas-hub.dev/aws/sqs/${var.environment}"
}

resource "aws_iam_role" "cloud_run_telemetry" {
  count = var.google_service_account_subject == null ? 0 : 1
  name  = "${var.queue_name}-${var.environment}-publisher"
  tags  = var.tags

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = "accounts.google.com" }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "accounts.google.com:aud"  = var.google_service_account_subject
          "accounts.google.com:sub"  = var.google_service_account_subject
          "accounts.google.com:oaud" = local.telemetry_audience
        }
      }
    }]
  })
}

resource "aws_iam_role_policy" "cloud_run_telemetry" {
  count = var.google_service_account_subject == null ? 0 : 1
  name  = "publish-telemetry"
  role  = aws_iam_role.cloud_run_telemetry[count.index].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["sqs:GetQueueAttributes", "sqs:SendMessage"]
      Resource = module.telemetry_queue.queue_arn
    }]
  })
}

output "cloud_run_telemetry" {
  value = var.google_service_account_subject == null ? null : {
    region    = var.aws_region
    role_arn  = one(aws_iam_role.cloud_run_telemetry[*].arn)
    audience  = local.telemetry_audience
    queue_url = module.telemetry_queue.queue_url
  }
}
