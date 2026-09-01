/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.landbank;

import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ph.gov.dost.aisetup.landbank.dto.CreateLandBankBranchRequest;
import ph.gov.dost.aisetup.landbank.dto.LandBankBranchDto;
import ph.gov.dost.aisetup.landbank.dto.UpdateLandBankBranchRequest;

@Service
public class LandBankBranchService {

    private final LandBankBranchRepository repository;

    public LandBankBranchService(LandBankBranchRepository repository) {
        this.repository = repository;
    }

    public List<LandBankBranchDto> list(boolean activeOnly) {
        List<LandBankBranch> rows =
                activeOnly ? repository.findAllByActiveTrueOrderByNameAsc() : repository.findAllByOrderByNameAsc();
        return rows.stream().map(this::toDto).toList();
    }

    public LandBankBranchDto getById(String id) {
        return toDto(findOrThrow(id));
    }

    @Transactional
    public LandBankBranchDto create(CreateLandBankBranchRequest request, String createdBy) {
        String name = requireNonBlank(request.getName(), "Branch name is required.");
        String address = requireNonBlank(request.getAddress(), "Branch address is required.");
        String cityProvince = requireNonBlank(request.getCityProvince(), "City/province is required.");
        String managerName = requireNonBlank(request.getManagerName(), "Manager name is required.");
        String officeId = normalizeOfficeId(request.getOfficeId());
        validateOfficeId(officeId);

        repository.findByNameIgnoreCase(name).ifPresent(existing -> {
            throw new IllegalArgumentException("A branch with this name already exists.");
        });

        Instant now = Instant.now();
        LandBankBranch branch = new LandBankBranch();
        branch.setId(UUID.randomUUID().toString());
        branch.setName(name);
        branch.setAddress(address);
        branch.setCityProvince(cityProvince);
        branch.setManagerName(managerName);
        branch.setManagerTitle(
                blankToDefault(request.getManagerTitle(), "Branch Manager"));
        branch.setOfficeId(officeId);
        branch.setActive(true);
        branch.setCreatedBy(createdBy);
        branch.setCreatedAt(now);
        branch.setUpdatedAt(now);

        return toDto(repository.save(branch));
    }

    @Transactional
    public LandBankBranchDto update(String id, UpdateLandBankBranchRequest request) {
        LandBankBranch branch = findOrThrow(id);

        if (request.getName() != null) {
            String name = requireNonBlank(request.getName(), "Branch name is required.");
            repository.findByNameIgnoreCase(name).ifPresent(existing -> {
                if (!existing.getId().equals(id)) {
                    throw new IllegalArgumentException("A branch with this name already exists.");
                }
            });
            branch.setName(name);
        }
        if (request.getAddress() != null) {
            branch.setAddress(requireNonBlank(request.getAddress(), "Branch address is required."));
        }
        if (request.getCityProvince() != null) {
            branch.setCityProvince(requireNonBlank(request.getCityProvince(), "City/province is required."));
        }
        if (request.getManagerName() != null) {
            branch.setManagerName(requireNonBlank(request.getManagerName(), "Manager name is required."));
        }
        if (request.getManagerTitle() != null) {
            branch.setManagerTitle(blankToDefault(request.getManagerTitle(), "Branch Manager"));
        }
        if (request.getOfficeId() != null) {
            String officeId = normalizeOfficeId(request.getOfficeId());
            validateOfficeId(officeId);
            branch.setOfficeId(officeId);
        }
        if (request.getActive() != null) {
            branch.setActive(request.getActive());
        }

        branch.setUpdatedAt(Instant.now());
        return toDto(repository.save(branch));
    }

    @Transactional
    public LandBankBranchDto deactivate(String id) {
        LandBankBranch branch = findOrThrow(id);
        branch.setActive(false);
        branch.setUpdatedAt(Instant.now());
        return toDto(repository.save(branch));
    }

    private LandBankBranch findOrThrow(String id) {
        return repository.findById(id).orElseThrow(() -> new NoSuchElementException("LandBank branch not found."));
    }

    private static String requireNonBlank(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }

    private static String blankToDefault(String value, String defaultValue) {
        return value == null || value.isBlank() ? defaultValue : value.trim();
    }

    private static String normalizeOfficeId(String officeId) {
        if (officeId == null || officeId.isBlank()) {
            return null;
        }
        return officeId.trim();
    }

    private static void validateOfficeId(String officeId) {
        if (officeId != null && !LandBankOfficeIds.isKnownOfficeId(officeId)) {
            throw new IllegalArgumentException("Unknown PSTO office id: " + officeId);
        }
    }

    private LandBankBranchDto toDto(LandBankBranch branch) {
        LandBankBranchDto dto = new LandBankBranchDto();
        dto.setId(branch.getId());
        dto.setName(branch.getName());
        dto.setAddress(branch.getAddress());
        dto.setCityProvince(branch.getCityProvince());
        dto.setManagerName(branch.getManagerName());
        dto.setManagerTitle(branch.getManagerTitle());
        dto.setOfficeId(branch.getOfficeId());
        dto.setActive(branch.isActive());
        dto.setCreatedBy(branch.getCreatedBy());
        dto.setCreatedAt(branch.getCreatedAt() != null ? branch.getCreatedAt().toString() : null);
        dto.setUpdatedAt(branch.getUpdatedAt() != null ? branch.getUpdatedAt().toString() : null);
        return dto;
    }
}
