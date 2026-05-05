from rest_framework import serializers
from django.http import HttpRequest
from allauth.utils import generate_unique_username
from allauth.account.adapter import get_adapter
from allauth.account.utils import setup_user_email
from allauth.account.forms import ResetPasswordForm
from dj_rest_auth.serializers import PasswordResetSerializer
from allauth.account import app_settings as allauth_settings
from django.utils.translation import gettext_lazy as _
from ..models import *

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "name", "is_verified","user_type"]
        
class SignupSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "name", "email", "password","user_type")
        extra_kwargs = {
            "password": {"write_only": True, "style": {"input_type": "password"}},
            "email": {
                "required": True,
                "allow_blank": False,
            },
            "user_type": {
                "required": True,
                "allow_blank": False,
            },
        }

    def _get_request(self):
        request = self.context.get("request")
        if (
            request
            and not isinstance(request, HttpRequest)
            and hasattr(request, "_request")
        ):
            request = request._request
        return request

    def validate_email(self, email):
        email = get_adapter().clean_email(email)
        if allauth_settings.UNIQUE_EMAIL:
            if email and User.objects.filter(email__iexact=email).exists():
                raise serializers.ValidationError(
                    _("A user is already registered with this e-mail address.")
                )
        return email

    def create(self, validated_data):
        user_type = validated_data.pop("user_type", None)
        password = validated_data.get("password")
        user = User(**validated_data)
        if user_type:
            if user_type == "ADMIN":
                user.is_staff = True
                user.is_superuser = True
            user.user_type = user_type.upper()
        else:
            user.user_type = "USER"
        user.set_password(password)
        user.save()
        request = self._get_request()
        setup_user_email(request, user, [])
        return user

    def save(self, request=None):
        """rest_auth passes request so we must override to accept it"""
        return super().save()
    
    
    
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = "__all__"
        read_only_fields = ["id"]
        
        
class PasswordSerializer(PasswordResetSerializer):
    """Custom serializer for rest_auth to solve reset password error"""

    password_reset_form_class = ResetPasswordForm


class AdminUserSerializer(serializers.ModelSerializer):
    assigned_templates = serializers.PrimaryKeyRelatedField(
        read_only=True,
        many=True
    )
    assigned_templates_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    password = serializers.CharField(write_only=True, required=False)
    has_payment_added = serializers.SerializerMethodField()
    has_subscription = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "username", "name", "email", "user_type", 
            "is_verified", "assigned_templates", "assigned_templates_ids", 
            "password", "has_payment_added", "has_subscription"
        ]

    def get_has_payment_added(self, obj):
        return obj.payment_methods.exists()

    def get_has_subscription(self, obj):
        return obj.subscriptions.filter(status="active").exists()

    def create(self, validated_data):
        assigned_templates_ids = validated_data.pop('assigned_templates_ids', [])
        password = validated_data.pop('password', None)
        
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
            
        user.is_verified = True
        user.save()
        
        if assigned_templates_ids:
            from templates.models import Templates
            templates = Templates.objects.filter(id__in=assigned_templates_ids)
            for t in templates:
                t.assigned_users.add(user)
            
        return user

    def update(self, instance, validated_data):
        assigned_templates_ids = validated_data.pop('assigned_templates_ids', None)
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        if password:
            instance.set_password(password)
            
        instance.save()
        
        if assigned_templates_ids is not None:
            from templates.models import Templates
            # Clear existing assignments first
            assigned_templates = instance.assigned_templates.all()
            for t in assigned_templates:
                t.assigned_users.remove(instance)
            
            # Add new assignments
            new_templates = Templates.objects.filter(id__in=assigned_templates_ids)
            for t in new_templates:
                t.assigned_users.add(instance)
            
        return instance

