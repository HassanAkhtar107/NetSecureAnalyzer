from django.conf import settings
from rest_framework.routers import DefaultRouter, SimpleRouter
from users.api.views import (
    UserViewSet,
    SignupViewSet,
    LoginViewSet,
    userProfileView,
    deleteUserView,
    AdminUserViewSet
)

from analyzer.api.views import (
    NetworkViewSet,
    FirewallLogViewSet,
    VPNStatusViewSet,
    FirewallRuleViewSet,
    UserDeviceViewSet,
    ImageTransferViewSet
)

if settings.DEBUG:
    router = DefaultRouter()
else:
    router = SimpleRouter()

router.register("users", UserViewSet)
router.register("signup", SignupViewSet, basename="signup")
router.register("login", LoginViewSet, basename="login")
router.register("user-profile", userProfileView, basename="user-profile")
router.register("delete-user", deleteUserView, basename="delete-user")
router.register("admin_users", AdminUserViewSet, basename="admin-users")

# analyzer
router.register("networks", NetworkViewSet, basename="network")
router.register("image-transfers", ImageTransferViewSet, basename="image-transfer")
router.register("firewall-logs", FirewallLogViewSet, basename="firewall-log")
router.register("vpn-status", VPNStatusViewSet, basename="vpn-status")
router.register("firewall-rules", FirewallRuleViewSet, basename="firewall-rule")
router.register("user-devices", UserDeviceViewSet, basename="user-device")


app_name = "api"
urlpatterns = router.urls
