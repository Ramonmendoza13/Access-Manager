package com.accessmanager.service;

import com.accessmanager.exception.ImageUploadException;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

    private final Cloudinary cloudinary;

    public String uploadImage(MultipartFile file, String folder) {
        validateImage(file);

        try {
            log.info("Uploading image to Cloudinary folder='{}', size={} bytes", folder, file.getSize());

            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap("folder", folder)
            );

            String secureUrl = (String) result.get("secure_url");
            log.info("Image uploaded successfully: {}", secureUrl);
            return secureUrl;
        } catch (Exception e) {
            log.error("Failed to upload image to Cloudinary folder='{}'", folder, e);
            throw new ImageUploadException("Error uploading image to Cloudinary: " + e.getMessage(), e);
        }
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Image file must not be null or empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException(
                    "Invalid file type: '" + contentType + "'. Only image files are allowed");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                    "File size " + file.getSize() + " bytes exceeds maximum allowed size of 5 MB");
        }
    }
}
