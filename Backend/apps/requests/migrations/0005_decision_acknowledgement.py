from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("requests", "0004_decision_fields_comments_mira_policy"),
    ]

    operations = [
        migrations.AddField(
            model_name="remoteworkrequest",
            name="decision_notified_at",
            field=models.DateTimeField(
                blank=True,
                help_text="When the employee was notified of a final decision",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="remoteworkrequest",
            name="decision_acknowledged_at",
            field=models.DateTimeField(
                blank=True,
                help_text="When the employee acknowledged the decision modal",
                null=True,
            ),
        ),
    ]
