$workflow = Get-Content 'C:\comeplete\n8n_workflows\live_class_reminder_v1_enterprise.json' -Raw
$headers = @{
    'X-N8N-API-KEY' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiODVjMGMxMy0yYjQ2LTQxYTQtODEyYy1kYTA4ODBhZjMyZjgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY2NzI3ODg5LCJleHAiOjE3NjkzMTcyMDB9.VM1eXrhZLX5Wl1wSfL0M_m5PRPT_JMfmRaZT5X9zwSM'
    'Content-Type' = 'application/json'
}
$result = Invoke-RestMethod -Uri 'http://localhost:5678/api/v1/workflows' -Method POST -Headers $headers -Body $workflow
$result | ConvertTo-Json -Depth 5
