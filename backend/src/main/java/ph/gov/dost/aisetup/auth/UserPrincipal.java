/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.auth;

import java.util.Collection;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public class UserPrincipal implements UserDetails {

    private final UserAccount account;

    public UserPrincipal(UserAccount account) {
        this.account = account;
    }

    public UserAccount getAccount() {
        return account;
    }

    public String getUserId() {
        return account.getId();
    }

    public String getRole() {
        return account.getRole();
    }

    public String getApplicantId() {
        return account.getApplicantId();
    }

    public boolean isStaff() {
        String role = account.getRole();
        return "admin".equals(role)
                || "agent".equals(role)
                || "provincial-director".equals(role);
    }

    public boolean isAdmin() {
        return "admin".equals(account.getRole());
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + account.getRole().toUpperCase().replace('-', '_')));
    }

    @Override
    public String getPassword() {
        return account.getPasswordHash();
    }

    @Override
    public String getUsername() {
        return account.getEmail();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return account.isEnabled();
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return account.isEnabled();
    }
}
