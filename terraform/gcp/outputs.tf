output "artifact_repository" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.api.repository_id}"
}

output "google_service_account_subject" {
  value = google_service_account.api.unique_id
}

output "secret_ids" {
  value = { for name, secret in google_secret_manager_secret.runtime : name => secret.secret_id }
}

output "migration_job" {
  value = one(google_cloud_run_v2_job.migrate[*].name)
}

output "api_url" {
  value = one(google_cloud_run_v2_service.api[*].uri)
}
