/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.auth;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {}

    public static UserPrincipal requirePrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal principal)) {
            throw new AccessDeniedException("Authentication required");
        }
        return principal;
    }

    public static void requireStaff() {
        UserPrincipal principal = requirePrincipal();
        if (!principal.isStaff()) {
            throw new AccessDeniedException("Staff role required");
        }
    }

    /** Regional admin only — staff user CRUD. */
    public static void requireAdmin() {
        UserPrincipal principal = requirePrincipal();
        if (!principal.isAdmin()) {
            throw new AccessDeniedException("Admin role required");
        }
    }

    public static void requireCanAccessApplicant(String applicantId) {
        UserPrincipal principal = requirePrincipal();
        if (principal.isStaff()) {
            return;
        }
        if (applicantId == null || !applicantId.equals(principal.getApplicantId())) {
            throw new AccessDeniedException("Not allowed to access this applicant record");
        }
    }
}
