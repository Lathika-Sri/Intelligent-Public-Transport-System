package com.ipts.service;

import com.ipts.model.Bus;
import org.springframework.stereotype.Service;

import java.time.LocalTime;

@Service
public class CrowdPredictionService {

    public String predictCrowdLevel(LocalTime time) {
        int hour = time.getHour();
        // Morning peak: 7-10, Evening peak: 17-20
        if ((hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20)) return "HIGH";
        if ((hour >= 11 && hour <= 13) || (hour >= 21 && hour <= 22)) return "MEDIUM";
        return "LOW";
    }

    public int predictCrowdCount(LocalTime time, int maxCapacity) {
        return switch (predictCrowdLevel(time)) {
            case "HIGH"   -> (int)(maxCapacity * (0.75 + Math.random() * 0.20));
            case "MEDIUM" -> (int)(maxCapacity * (0.40 + Math.random() * 0.20));
            default       -> (int)(maxCapacity * (0.05 + Math.random() * 0.20));
        };
    }

    public void updateBusCrowd(Bus bus) {
        bus.setCrowdCount(predictCrowdCount(LocalTime.now(), bus.getMaxCapacity()));
    }
}
