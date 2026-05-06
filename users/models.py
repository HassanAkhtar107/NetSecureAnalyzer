from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.urls import reverse
from django.utils.translation import gettext_lazy as _

USER_TYPE=(
    ("USER","USER"),
    ("ADMIN","ADMIN"),
)

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('user_type', 'ADMIN')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    objects = CustomUserManager()
    """
    Default custom user model for bostit_03082023.
    If adding fields that need to be filled at user signup,
    check forms.SignupForm and forms.SocialSignupForms accordingly.
    """

    # Remove username field from AbstractUser
    username = models.CharField(_("Username"), max_length=150, unique=False, null=True, blank=True)
    # Use email as the unique identifier
    email = models.EmailField(_("email address"), unique=True)

    #: First and last name do not cover name patterns around the globe
    name = models.CharField(_("Name of User"), blank=True, max_length=255)
    first_name = None  # type: ignore
    last_name = None  # type: ignore
    is_verified = models.BooleanField(default=False)
    otp_counter = models.IntegerField(default=0)
    user_type = models.CharField(choices=USER_TYPE, max_length=10, null=True, blank=True)
    stripe_customer_id = models.CharField(max_length=255, null=True, blank=True)
    assigned_network = models.ForeignKey("analyzer.Network", on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    # Use email as the USERNAME_FIELD for authentication
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def get_absolute_url(self):
        """Get url for user's detail view using email as identifier."""
        return reverse("users:detail", kwargs={"username": self.email})

    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.user_type = "ADMIN"
        elif not self.user_type:
            self.user_type = "USER"
        super().save(*args, **kwargs)



class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)
    phone_number = models.CharField(max_length=15, null=True, blank=True)
    profile_photo = models.ImageField(null=True, blank=True)
    address = models.CharField(max_length=1000, null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    zipcode = models.CharField(max_length=100, null=True, blank=True)
    state = models.CharField(max_length=100, null=True, blank=True)
    country = models.CharField(max_length=100, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    