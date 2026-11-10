package com.baloncam;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BalonCamApplication {
    public static void main(String[] args) {
        SpringApplication.run(BalonCamApplication.class, args);
    }
}
