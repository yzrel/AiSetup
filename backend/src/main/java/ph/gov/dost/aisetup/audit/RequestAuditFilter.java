/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.audit;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpMethod;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import ph.gov.dost.aisetup.auth.UserPrincipal;

/**
 * Persists one {@code http.request} audit row per authenticated API call.
 * Registered only in the security filter chain (servlet auto-registration disabled).
 */
@Component
public class RequestAuditFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RequestAuditFilter.class);

    private final AuditService auditService;

    public RequestAuditFilter(AuditService auditService) {
        this.auditService = auditService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            return true;
        }
        String uri = request.getRequestURI();
        return uri != null && (uri.equals("/health") || uri.endsWith("/health"));
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        try {
            filterChain.doFilter(request, response);
        } finally {
            recordIfAuthenticated(request, response);
        }
    }

    private void recordIfAuthenticated(HttpServletRequest request, HttpServletResponse response) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal)) {
                return;
            }
            String path = request.getRequestURI();
            if (path == null || path.isBlank()) {
                path = request.getServletPath();
            }
            auditService.recordHttp(request.getMethod(), path, response.getStatus());
        } catch (Exception e) {
            log.warn("Failed to persist HTTP audit event: {}", e.getMessage());
        }
    }
}
