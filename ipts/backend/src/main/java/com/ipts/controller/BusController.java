package com.ipts.controller;

import com.ipts.model.Bus;
import com.ipts.model.Route;
import com.ipts.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api")
public class BusController {

    @Autowired private BusSimulatorService    simulatorService;
    @Autowired private ETAService             etaService;
    @Autowired private CrowdPredictionService crowdService;
    @Autowired private RouteDataService       routeDataService;

    @GetMapping("/buses")
    public ResponseEntity<Map<String, Object>> getAllBuses() {
        List<Map<String, Object>> list = new ArrayList<>();
        for (Bus bus : simulatorService.getAllBuses().values()) {
            Route route = routeDataService.getRoute(bus.getRouteId());
            Map<String, Object> d = new HashMap<>();
            d.put("busId",              bus.getBusId());
            d.put("routeId",            bus.getRouteId());
            d.put("routeName",          route != null ? route.getName() : "");
            d.put("currentStopIndex",   bus.getCurrentStopIndex());
            d.put("currentStopName",
                (route != null && route.getStopAt(bus.getCurrentStopIndex()) != null)
                    ? route.getStopAt(bus.getCurrentStopIndex()).getName() : "");
            d.put("speedKmh",           bus.getSpeedKmh());
            d.put("distanceToNextStop", bus.getDistanceToNextStop());
            d.put("isDelayed",          bus.isDelayed());
            d.put("crowdLevel",         bus.getCrowdLevel());
            d.put("crowdPercentage",    bus.getCrowdPercentage());
            d.put("crowdCount",         bus.getCrowdCount());
            d.put("maxCapacity",        bus.getMaxCapacity());
            d.put("etaToNextStop",      etaService.calculateETAToNextStop(bus));
            d.put("lastUpdated",        bus.getLastUpdated());
            if (route != null) {
                com.ipts.model.Stop cur = route.getStopAt(bus.getCurrentStopIndex());
                com.ipts.model.Stop nxt = route.getStopAt(
                    Math.min(bus.getCurrentStopIndex() + 1, route.getStopCount() - 1));
                if (cur != null && nxt != null) {
                    double spacing = route.getTotalDistanceKm() / (route.getStopCount() - 1);
                    double frac    = Math.max(0, Math.min(1, 1 - bus.getDistanceToNextStop() / spacing));
                    d.put("lat", cur.getLatitude()  + (nxt.getLatitude()  - cur.getLatitude())  * frac);
                    d.put("lng", cur.getLongitude() + (nxt.getLongitude() - cur.getLongitude()) * frac);
                }
            }
            list.add(d);
        }
        return ResponseEntity.ok(Map.of("success", true, "count", list.size(), "buses", list));
    }

    @GetMapping("/eta")
    public ResponseEntity<Map<String, Object>> getETA(@RequestParam String busId) {
        Bus bus = simulatorService.getBus(busId);
        if (bus == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(Map.of(
            "busId",         busId,
            "etaToNextStop", etaService.calculateETAToNextStop(bus),
            "etaToAllStops", etaService.getFullETAMap(bus),
            "currentSpeed",  bus.getSpeedKmh(),
            "isDelayed",     bus.isDelayed()
        ));
    }

    @GetMapping("/routes/{routeId}/buses")
    public ResponseEntity<Map<String, Object>> getBusesByRoute(@PathVariable String routeId) {
        Route route = routeDataService.getRoute(routeId);
        if (route == null) return ResponseEntity.notFound().build();
        List<Map<String, Object>> list = new ArrayList<>();
        for (Bus bus : simulatorService.getBusesOnRoute(routeId)) {
            list.add(Map.of(
                "busId", bus.getBusId(),
                "currentStop", route.getStopAt(bus.getCurrentStopIndex()).getName(),
                "crowdLevel", bus.getCrowdLevel(),
                "etaToNextStop", etaService.calculateETAToNextStop(bus),
                "isDelayed", bus.isDelayed()
            ));
        }
        return ResponseEntity.ok(Map.of(
            "routeId", routeId, "routeName", route.getName(),
            "stops", route.getStops(), "buses", list
        ));
    }

    @GetMapping("/crowd")
    public ResponseEntity<Map<String, Object>> getCrowd(@RequestParam String busId) {
        Bus bus = simulatorService.getBus(busId);
        if (bus == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(Map.of(
            "busId", busId,
            "crowdCount", bus.getCrowdCount(),
            "maxCapacity", bus.getMaxCapacity(),
            "crowdPercentage", bus.getCrowdPercentage(),
            "crowdLevel", bus.getCrowdLevel(),
            "isOvercrowded", bus.isOvercrowded(),
            "recommendation", bus.isOvercrowded()
                ? "Wait for next bus — this one is crowded"
                : "Good to board — comfortable space available"
        ));
    }

    @GetMapping("/routes")
    public ResponseEntity<?> getAllRoutes() {
        List<Map<String, Object>> list = new ArrayList<>();
        routeDataService.getAllRoutes().forEach((id, route) -> list.add(Map.of(
            "id", route.getId(), "name", route.getName(),
            "totalDistanceKm", route.getTotalDistanceKm(),
            "stopCount", route.getStopCount(), "stops", route.getStops()
        )));
        return ResponseEntity.ok(Map.of("routes", list));
    }

    @GetMapping("/smart-advice")
    public ResponseEntity<Map<String, Object>> getSmartAdvice(
            @RequestParam String fromStop, @RequestParam String toStop) {
        List<Map<String, Object>> options = new ArrayList<>();
        simulatorService.getAllBuses().values().forEach(bus -> {
            Route route = routeDataService.getRoute(bus.getRouteId());
            if (route == null) return;
            boolean serves = route.getStops().stream()
                .anyMatch(s -> s.getName().toLowerCase().contains(fromStop.toLowerCase()));
            if (!serves) return;
            options.add(Map.of(
                "busId", bus.getBusId(), "routeName", route.getName(),
                "etaMinutes", etaService.calculateETAToNextStop(bus),
                "crowdLevel", bus.getCrowdLevel(), "isDelayed", bus.isDelayed(),
                "recommendation", buildRec(bus)
            ));
        });
        options.sort((a, b) ->
            Double.compare((Double) a.get("etaMinutes"), (Double) b.get("etaMinutes")));
        return ResponseEntity.ok(Map.of(
            "from", fromStop, "to", toStop, "options", options,
            "bestChoice", options.isEmpty() ? "No buses available" : "Bus " + options.get(0).get("busId")
        ));
    }

    private String buildRec(Bus bus) {
        if (bus.isDelayed() && bus.isOvercrowded()) return "⚠ Delayed & crowded — wait for next bus";
        if (bus.isDelayed())                        return "⚠ Delayed — expect +30% extra travel time";
        if (bus.isOvercrowded())                    return "Crowded — consider next bus if possible";
        return "✓ Good to board — on time & comfortable";
    }
}
