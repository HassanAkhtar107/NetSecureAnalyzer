from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin, UpdateModelMixin
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet
from rest_framework.viewsets import ModelViewSet, ViewSet
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.serializers import AuthTokenSerializer
from users.models import User, UserProfile
from .serializers import (
    UserSerializer,
    UserProfileSerializer,
    SignupSerializer,
    AdminUserSerializer
)
from rest_framework.permissions import IsAuthenticated,AllowAny,BasePermission
from rest_framework.authentication import TokenAuthentication
from .response_messages import *

User = get_user_model()


class UserViewSet(RetrieveModelMixin, ListModelMixin, UpdateModelMixin, GenericViewSet):
    serializer_class = UserSerializer
    queryset = User.objects.all()
    lookup_field = "username"

    def get_queryset(self, *args, **kwargs):
        assert isinstance(self.request.user.id, int)
        return self.queryset.filter(id=self.request.user.id)

    @action(detail=False)
    def me(self, request):
        serializer = UserSerializer(request.user, context={"request": request})
        return Response(status=status.HTTP_200_OK, data=serializer.data)


class SignupViewSet(ModelViewSet):
    """
    # Request
    {
        "username":"email",
        "password":"password"
    }
    # 200 Response{
        "token": <auth_token>,
        "user" : user_details,
    }
    """

    serializer_class = SignupSerializer
    permission_classes = [AllowAny]
    http_method_names = ["post"]

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        user = User.objects.get(id=response.data["id"])
        user_serializer = UserSerializer(user,context={"request":request})
        token, created = Token.objects.get_or_create(user=user)
        data = {"token": token.key, "user": user_serializer.data}
        return Response(data=data, status=status.HTTP_200_OK)

class LoginViewSet(ViewSet):
    """
    # Request
    {
        "username":"email",
        "password":"password"
    }
    # 200 Response if user not verified{
        "status":"ERROR",
        "token": <auth_token>,
        "user" : user_details,
        "message": "otp sended"
    }
    # 200 Response if user verified{
        "token": <auth_token>,
        "user" : user_details
    }
    """
    permission_classes = [AllowAny]
    serializer_class = AuthTokenSerializer

    def create(self, request):
        serializer = self.serializer_class(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        token, created = Token.objects.get_or_create(user=user)
        user_serializer = UserSerializer(user)
        if user.is_verified == True:
            return Response(
                {"token": token.key, "user": user_serializer.data},
                status=status.HTTP_200_OK,
            )

        data = {
            "token": token.key,
            "user": user_serializer.data,
        }

        return Response(data=data, status=status.HTTP_200_OK)
        
class userProfileView(ModelViewSet):
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    serializer_class: UserProfileSerializer
    queryset= UserProfile.objects.all()
    http_method_names = ['get','update','delete']
    
    def list(self,request):
        instance = UserProfile.objects.get(user=request.user)
        serializer = UserProfileSerializer(instance)
        return Response(data=serializer.data, status=status.HTTP_200_OK)
        
    def update(self,request):
        try:
            instance = UserProfile.objects.get(user=request.user)
            serializer = self.serializer_class(instance, data=request.data)
        except:
            serializer = self.serializer_class(data=request.data)
            
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(data=serializer.data, status=status.HTTP_201_CREATED)
        return Response(data=serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request):
        instance = UserProfile.objects.get(user=request.user)
        instance.delete()
        data = {"status": "ok", "message": delete_response}
        return Response(data=data, status=status.HTTP_200_OK)

class deleteUserView(ViewSet):
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def list(self,request):
        user = request.user
        user.delete()
        data = {"status": "OK", "message": delete_response}
        return Response(data=data, status=status.HTTP_200_OK)

class IsAdminUserType(BasePermission):
    """
    Allows access only to users with user_type == 'ADMIN'.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.user_type == "ADMIN")

class AdminUserViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated, IsAdminUserType]
    authentication_classes = [TokenAuthentication]
    serializer_class = AdminUserSerializer
    queryset = User.objects.all().order_by('-id')

    def get_queryset(self):
        # Exclude superusers if we only want to manage regular app users, 
        # or just return all users. Let's return all users for now.
        return super().get_queryset()