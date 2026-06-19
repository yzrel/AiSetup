package ph.gov.dost.aisetup.loi.dto;

public class LetterheadDto {

    private String enterpriseName;
    private String address;
    private String email;
    private String mobile;
    private String date;

    public LetterheadDto() {}

    public LetterheadDto(String enterpriseName, String address, String email, String mobile, String date) {
        this.enterpriseName = enterpriseName;
        this.address = address;
        this.email = email;
        this.mobile = mobile;
        this.date = date;
    }

    public String getEnterpriseName() { return enterpriseName; }
    public void setEnterpriseName(String enterpriseName) { this.enterpriseName = enterpriseName; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
}
