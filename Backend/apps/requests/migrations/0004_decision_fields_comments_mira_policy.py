from django.db import migrations, models
import django.db.models.deletion
import uuid
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ("requests", "0003_remoteworkrequest_confirmed_role_eligible_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="remoteworkrequest",
            name="decision_source",
            field=models.CharField(
                choices=[("auto", "Automated"), ("human", "Human")],
                default="auto",
                help_text="Whether current status was set automatically or by a human reviewer",
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="remoteworkrequest",
            name="decision_status",
            field=models.CharField(
                choices=[
                    ("auto_approved", "Auto Approved"),
                    ("auto_rejected", "Auto Rejected"),
                    ("needs_review", "Needs Review"),
                ],
                default="needs_review",
                help_text="Triage bucket used by admin portal",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="remoteworkrequest",
            name="exception_type",
            field=models.CharField(
                blank=True,
                help_text="Categorised exception type (e.g. extended_days, sanctioned_country)",
                max_length=80,
            ),
        ),
        migrations.AddField(
            model_name="remoteworkrequest",
            name="flags",
            field=models.JSONField(
                blank=True,
                default=list,
                help_text="Machine-applied policy flags (e.g. exceeds_annual_limit, sanctioned_country)",
            ),
        ),
        migrations.AddField(
            model_name="remoteworkrequest",
            name="requester_comment",
            field=models.TextField(
                blank=True, help_text="Employee-provided context or exception request comment"
            ),
        ),
        migrations.CreateModel(
            name="MiraQuestion",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ("question_text", models.TextField()),
                ("answer_text", models.TextField(blank=True)),
                ("context_country", models.CharField(blank=True, max_length=100)),
                ("linked_policy_section", models.CharField(blank=True, max_length=200)),
                ("answered", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="mira_questions",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="PolicyDocument",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                (
                    "doc_type",
                    models.CharField(
                        choices=[("policy", "Policy"), ("faq", "FAQ")], max_length=20
                    ),
                ),
                ("file", models.FileField(upload_to="policies/%Y/%m/")),
                ("version", models.PositiveIntegerField(default=1)),
                (
                    "status",
                    models.CharField(
                        choices=[("draft", "Draft"), ("published", "Published")],
                        default="draft",
                        max_length=20,
                    ),
                ),
                ("notes", models.TextField(blank=True)),
                ("uploaded_at", models.DateTimeField(auto_now_add=True)),
                (
                    "uploaded_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="uploaded_documents",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-uploaded_at"],
                "unique_together": {("doc_type", "version")},
            },
        ),
        migrations.CreateModel(
            name="RequestComment",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ("body", models.TextField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "author",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="request_comments",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "request",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="comments",
                        to="requests.remoteworkrequest",
                    ),
                ),
            ],
            options={"ordering": ["created_at"]},
        ),
    ]
