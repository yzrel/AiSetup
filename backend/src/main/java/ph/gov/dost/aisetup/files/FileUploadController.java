/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.files;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/applicants/{applicantId}/files")
public class FileUploadController {

    private final FileUploadService fileUploadService;

    public FileUploadController(FileUploadService fileUploadService) {
        this.fileUploadService = fileUploadService;
    }

    @GetMapping
    public List<Map<String, Object>> list(@PathVariable String applicantId) {
        return fileUploadService.list(applicantId);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> upload(
            @PathVariable String applicantId,
            @RequestParam(defaultValue = "general") String moduleKey,
            @RequestParam("file") MultipartFile file) throws IOException {
        return fileUploadService.upload(applicantId, moduleKey, file);
    }

    @GetMapping("/{fileId}")
    public ResponseEntity<Resource> download(
            @PathVariable String applicantId,
            @PathVariable String fileId) {
        FileUpload entity = fileUploadService.requireForDownload(applicantId, fileId);
        FileSystemResource resource = new FileSystemResource(entity.getStoragePath());
        String contentType = entity.getContentType() != null
                ? entity.getContentType()
                : MediaType.APPLICATION_OCTET_STREAM_VALUE;
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + entity.getOriginalFilename().replace("\"", "") + "\"")
                .body(resource);
    }
}
