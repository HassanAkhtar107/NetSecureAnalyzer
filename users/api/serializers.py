from rest_framework import serializers
from django.http import HttpRequest
from ..models import *

class UserSerializer(serializers.ModelSerializer):
    assigned_network_name = serializers.CharField(source='assigned_network.name', read_only=True)
    
    class Meta:
        model = User
        fields = ["id", "email", "name", "is_verified", "user_type", "assigned_network", "assigned_network_name"]
        
class SignupSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "name", "email", "password")
        extra_kwargs = {
            "password": {"write_only": True, "style": {"input_type": "password"}},
            "email": {
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
        if email and User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                "A user is already registered with this e-mail address."
            )
        return email

    def create(self, validated_data):
        password = validated_data.pop("password")
        email = validated_data.get("email", "")
        name = validated_data.get("name", "")
        # Use email as the username to satisfy the DB constraint without extra fields
        user = User(username=email, name=name, email=email)
        user.user_type = "USER"
        user.is_staff = False
        user.is_superuser = False
        user.set_password(password)
        user.save()
        return user

    def save(self, request=None):
        """rest_auth passes request so we must override to accept it"""
        return super().save()
    
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = "__all__"
        read_only_fields = ["id"]
        
class AdminUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            "id", "username", "name", "email", "user_type", 
            "is_verified", "assigned_network", "password"
        ]

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        email = validated_data.get('email')
        user_type = validated_data.get('user_type', 'USER')
        
        # Use email as username
        validated_data['username'] = email
        
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
            
        user.is_verified = True
        if user_type == 'ADMIN':
            user.is_staff = True
            user.is_superuser = True
        else:
            user.is_staff = False
            user.is_superuser = False
            
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

