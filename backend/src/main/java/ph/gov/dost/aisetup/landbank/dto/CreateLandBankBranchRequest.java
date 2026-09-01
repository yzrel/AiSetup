/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.landbank.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateLandBankBranchRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String address;

    @NotBlank
    private String cityProvince;

    @NotBlank
    private String managerName;

    private String managerTitle;

    private String officeId;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCityProvince() {
        return cityProvince;
    }

    public void setCityProvince(String cityProvince) {
        this.cityProvince = cityProvince;
    }

    public String getManagerName() {
        return managerName;
    }

    public void setManagerName(String managerName) {
        this.managerName = managerName;
    }

    public String getManagerTitle() {
        return managerTitle;
    }

    public void setManagerTitle(String managerTitle) {
        this.managerTitle = managerTitle;
    }

    public String getOfficeId() {
        return officeId;
    }

    public void setOfficeId(String officeId) {
        this.officeId = officeId;
    }
}
