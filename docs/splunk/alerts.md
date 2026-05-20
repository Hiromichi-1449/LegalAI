# LegalAI Splunk Scheduled Alerts

Each alert runs on a schedule, evaluates the SPL condition, and fires a webhook
to `POST /internal/splunk-alert` when the condition is met.

All thresholds are provisional — mark each alert `[TUNE AFTER BASELINE]` in
Splunk until real usage data establishes normal per-firm patterns.

---

## Webhook Action Setup (apply to every alert)

In each alert's **Actions** configuration:

- Action: **Webhook**
- URL: `https://your-legalai-host/internal/splunk-alert`
- Headers: `X-Splunk-Alert-Secret: <value of SPLUNK_ALERT_SECRET>`
- Body: Splunk default (JSON with search results)

---

## Alert 1 — `security.unusual_ai_usage`

**Schedule:** every 30 minutes  
**Threshold:** fires when any result row is returned  
**[TUNE AFTER BASELINE]**

```spl
index=legalai sourcetype="legalai:json" event_type="rag.retrieval_completed" earliest=-30m
| stats count as rag_query_count by user_id firm_id
| appendcols
    [search index=legalai sourcetype="legalai:json" event_type="rag.retrieval_completed" earliest=-7d
     | bin _time span=30m
     | stats count as period_count by user_id _time
     | stats avg(period_count) as baseline_query_count by user_id]
| where rag_query_count >= 15 AND rag_query_count > (baseline_query_count * 3)
| eval
    alert_name="security.unusual_ai_usage",
    window_minutes=30,
    risk_score=round(rag_query_count / max(baseline_query_count, 1) / 10, 2)
| fields firm_id user_id alert_name rag_query_count baseline_query_count risk_score window_minutes
```

---

## Alert 2 — `security.excessive_client_access`

**Schedule:** every 60 minutes  
**Threshold:** fires when any result row is returned  
**[TUNE AFTER BASELINE]**

```spl
index=legalai sourcetype="legalai:json" event_type="rag.retrieval_completed" earliest=-60m
| stats dc(client_id) as distinct_clients by user_id firm_id
| where distinct_clients > 10
| eval alert_name="security.excessive_client_access", window_minutes=60, risk_score=round(distinct_clients / 10, 2)
| fields firm_id user_id alert_name distinct_clients risk_score window_minutes
```

---

## Alert 3 — `security.repeated_permission_denied`

**Schedule:** every 15 minutes  
**Threshold:** fires when any result row is returned  
**[TUNE AFTER BASELINE]**

```spl
index=legalai sourcetype="legalai:json" event_type="auth.permission_denied" earliest=-15m
| stats count as denial_count by user_id firm_id
| where denial_count > 5
| eval alert_name="security.repeated_permission_denied", window_minutes=15, risk_score=round(denial_count / 5, 2)
| fields firm_id user_id alert_name denial_count risk_score window_minutes
```

---

## Alert 4 — `security.suspicious_access`

**Schedule:** every 60 minutes  
**Threshold:** fires when any result row is returned  
**[TUNE AFTER BASELINE]**

```spl
index=legalai sourcetype="legalai:json"
  event_type IN ("rag.retrieval_completed", "auth.permission_denied") earliest=-60m
| eval is_denial=if(event_type="auth.permission_denied", 1, 0)
| stats
    dc(client_id)      as distinct_clients,
    sum(is_denial)     as denial_count
  by user_id firm_id
| where distinct_clients > 5 AND denial_count > 3
| eval
    alert_name="security.suspicious_access",
    window_minutes=60,
    risk_score=round((distinct_clients/5 + denial_count/3) / 2, 2)
| fields firm_id user_id alert_name distinct_clients denial_count risk_score window_minutes
```

---

## Alert 5 — `security.data_export_spike`

**Schedule:** every 30 minutes  
**Threshold:** fires when any result row is returned  
**[TUNE AFTER BASELINE]**

```spl
index=legalai sourcetype="legalai:json" event_type="document.download_url_issued" earliest=-30m
| stats count as download_count by user_id firm_id
| appendcols
    [search index=legalai sourcetype="legalai:json" event_type="document.download_url_issued" earliest=-7d
     | bin _time span=30m
     | stats count as period_count by user_id _time
     | stats avg(period_count) as baseline_download_count by user_id]
| where download_count > 20 OR download_count > (baseline_download_count * 3)
| eval
    alert_name="security.data_export_spike",
    window_minutes=30,
    risk_score=round(download_count / max(baseline_download_count, 1) / 10, 2)
| fields firm_id user_id alert_name download_count baseline_download_count risk_score window_minutes
```

---

## Import Checklist

- [ ] Create index `legalai` in Splunk (Settings → Indexes → New Index)
- [ ] Create HEC token scoped to index `legalai` (Settings → Data Inputs → HTTP Event Collector)
- [ ] Import `dashboard.xml` (Dashboards → Create New Dashboard → Source)
- [ ] Create each alert above as a Saved Search (Search → Save As → Alert)
- [ ] Set the webhook action URL and `X-Splunk-Alert-Secret` header on each alert
- [ ] Set `SPLUNK_ENABLED=true` and all `SPLUNK_*` env vars in your LegalAI deployment
- [ ] Run a test query to confirm events appear in `index=legalai`
