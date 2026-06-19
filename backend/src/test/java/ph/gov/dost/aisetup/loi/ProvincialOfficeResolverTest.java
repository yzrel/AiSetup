package ph.gov.dost.aisetup.loi;

import org.junit.jupiter.api.Test;
import ph.gov.dost.aisetup.loi.dto.AddresseeDto;

import static org.junit.jupiter.api.Assertions.*;

class ProvincialOfficeResolverTest {

    @Test
    void regionalAddresseeMatchesPdfFormat() {
        AddresseeDto regional = ProvincialOfficeResolver.REGIONAL_ADDRESSEE;
        assertEquals("ENGR. SAMMY P. MALAWAN", regional.getName());
        assertTrue(regional.getLines().get(0).contains("MALAWAN"));
        assertTrue(regional.getLines().stream().anyMatch(l -> l.contains("Halal Laboratory")));
    }

    @Test
    void cotabatoResolvesToMichaelMayo() {
        var resolved = ProvincialOfficeResolver.resolveProvincialOffice("Cotabato");
        assertFalse(resolved.defaulted());
        assertEquals("THRU: MR. MICHAEL T. MAYO", resolved.addressee().getThruLine());
        assertTrue(resolved.addressee().getOfficeName().contains("Cotabato"));
    }

    @Test
    void unknownProvinceDefaultsWithFlag() {
        var resolved = ProvincialOfficeResolver.resolveProvincialOffice("");
        assertTrue(resolved.defaulted());
    }
}
