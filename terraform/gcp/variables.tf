variable "project_id" {
  description = "Projeto GCP já criado e com faturamento associado."
  type        = string
}

variable "region" {
  description = "Região do Cloud Run e do Artifact Registry."
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Sufixo compartilhado pelos recursos da aplicação."
  type        = string
  default     = "dev"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{0,10}[a-z0-9]$", var.environment))
    error_message = "Use de 2 a 12 caracteres minúsculos, dígitos e hífens."
  }
}

variable "api_image" {
  description = "Imagem da API em linux/amd64, fixada pelo digest SHA-256. Null cria os recursos de bootstrap."
  type        = string
  default     = null

  validation {
    condition     = var.api_image == null ? true : can(regex("@sha256:[0-9a-f]{64}$", var.api_image))
    error_message = "Informe a imagem com @sha256: seguido de 64 caracteres hexadecimais."
  }
}

variable "secret_versions" {
  description = "Versões numéricas dos segredos. Os valores são cadastrados diretamente no Secret Manager."
  type        = map(string)
  default     = { DATABASE_URL = "1", JWT_SECRET_KEY = "1", GEMINI_API_KEY = "1" }

  validation {
    condition = (
      toset(keys(var.secret_versions)) == toset(["DATABASE_URL", "JWT_SECRET_KEY", "GEMINI_API_KEY"])
      && alltrue([for version in values(var.secret_versions) : can(regex("^[1-9][0-9]*$", version))])
    )
    error_message = "Informe versões numéricas para DATABASE_URL, JWT_SECRET_KEY e GEMINI_API_KEY."
  }
}

variable "frontend_origins" {
  description = "Origens HTTPS exatas que acessam a API pelo navegador."
  type        = set(string)
  default     = []

  validation {
    condition     = alltrue([for origin in var.frontend_origins : can(regex("^https://[^/*[:space:]]+$", origin))])
    error_message = "Use origens HTTPS sem caminho nem curinga."
  }
}

variable "public_api" {
  description = "Libera requisições pelo navegador. Habilite após concluir as migrações."
  type        = bool
  default     = false
}

variable "public_registration" {
  description = "Controla a criação de contas pela API."
  type        = bool
  default     = false
}

variable "aws_telemetry" {
  description = "Saídas não secretas do Terraform AWS para publicar eventos na SQS."
  type = object({
    region    = string
    role_arn  = string
    audience  = string
    queue_url = string
  })
  default = null
}
