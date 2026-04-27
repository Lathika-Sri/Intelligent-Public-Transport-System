package com.ipts;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class IPTSApplication {
    public static void main(String[] args) {
        SpringApplication.run(IPTSApplication.class, args);
        System.out.println("🚌 IPTS Server started → http://localhost:8080");
    }
}
