from django.db import migrations


def migrate_pending_to_escalated(apps, schema_editor):
    RemoteWorkRequest = apps.get_model("requests", "RemoteWorkRequest")
    RemoteWorkRequest.objects.filter(status="pending").update(
        status="escalated",
        decision_status="needs_review",
    )


class Migration(migrations.Migration):
    dependencies = [
        ("requests", "0005_decision_acknowledgement"),
    ]

    operations = [
        migrations.RunPython(migrate_pending_to_escalated, migrations.RunPython.noop),
    ]
