package com.ipts.service;

import com.ipts.model.Bus;
import com.ipts.model.Route;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class ETAService {

    @Autowired
    private RouteDataService routeDataService;

    // ETA (minutes) = Distance (km) / Speed (km/h) × 60
    public double calculateETA(Bus bus, int targetStopIndex) {
        Route route = routeDataService.getRoute(bus.getRouteId());
        if (route == null) return -1;

        int curIdx = bus.getCurrentStopIndex();
        if (targetStopIndex <= curIdx) return 0;

        double stopSpacing     = route.getTotalDistanceKm() / (route.getStopCount() - 1);
        double totalDistanceKm = bus.getDistanceToNextStop();
        int    stopsAfterNext  = targetStopIndex - curIdx - 1;
        totalDistanceKm       += stopsAfterNext * stopSpacing;

        double etaMinutes = (totalDistanceKm / bus.getSpeedKmh()) * 60;
        if (bus.isDelayed()) etaMinutes *= 1.3; // +30% for traffic

        return Math.round(etaMinutes * 10.0) / 10.0;
    }

    public double calculateETAToNextStop(Bus bus) {
        return calculateETA(bus, bus.getCurrentStopIndex() + 1);
    }

    public Map<String, Double> getFullETAMap(Bus bus) {
        Map<String, Double> etaMap = new HashMap<>();
        Route route = routeDataService.getRoute(bus.getRouteId());
        if (route == null) return etaMap;

        for (int i = bus.getCurrentStopIndex() + 1; i < route.getStopCount(); i++) {
            etaMap.put(route.getStopAt(i).getName(), calculateETA(bus, i));
        }
        return etaMap;
    }
}
