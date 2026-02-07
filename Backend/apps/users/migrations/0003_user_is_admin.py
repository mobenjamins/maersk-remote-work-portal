# Generated migration for is_admin field on User model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0002_user_middle_name_user_phone_user_profile_completed_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="is_admin",
            field=models.BooleanField(
                default=False,
                help_text="Whether the user has access to the admin portal",
            ),
        ),
    ]
