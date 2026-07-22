/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;
import ph.gov.dost.aisetup.config.AisetupProperties;

@Service
public class JwtService {

    private final AisetupProperties properties;
    private final SecretKey key;

    public JwtService(AisetupProperties properties) {
        this.properties = properties;
        byte[] secretBytes = properties.getSecurity().getJwtSecret().getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < 32) {
            throw new IllegalStateException("aisetup.security.jwt-secret must be at least 32 bytes");
        }
        this.key = Keys.hmacShaKeyFor(secretBytes);
    }

    public String issueToken(UserAccount account) {
        long now = System.currentTimeMillis();
        long exp = now + properties.getSecurity().getJwtExpirationMs();
        return Jwts.builder()
                .subject(account.getId())
                .claim("email", account.getEmail())
                .claim("role", account.getRole())
                .claim("applicantId", account.getApplicantId())
                .issuedAt(new Date(now))
                .expiration(new Date(exp))
                .signWith(key)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractUserId(String token) {
        return parse(token).getSubject();
    }
}
