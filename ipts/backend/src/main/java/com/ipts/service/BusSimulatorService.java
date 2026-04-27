package com.ipts.service;

import com.ipts.model.Bus;
import com.ipts.model.Route;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.*;

@Service
public class BusSimulatorService {

    @Autowired private RouteDataService      routeDataService;
    @Autowired private CrowdPredictionService crowdService;
    @Autowired private ETAService            etaService;

    // ConcurrentHashMap: thread-safe — multiple threads read/write simultaneously
    private final ConcurrentHashMap<String, Bus> activeBuses =
        new ConcurrentHashMap<>();

    // 4-thread pool: runs all buses concurrently (not sequentially)
    private final ScheduledExecutorService executor =
        Executors.newScheduledThreadPool(4);

    @PostConstruct
    public void startSimulation() {
        // Route R1 — 3 buses
        activeBuses.put("101", new Bus("101", "R1", 0, 40.0, 60));
        activeBuses.put("102", new Bus("102", "R1", 2, 35.0, 60));
        activeBuses.put("103", new Bus("103", "R1", 4, 38.0, 60));

        // Route R2 — 2 buses
        activeBuses.put("201", new Bus("201", "R2", 0, 42.0, 80));
        activeBuses.put("202", new Bus("202", "R2", 3, 30.0, 80));

        // Route R3 — 2 buses
        activeBuses.put("301", new Bus("301", "R3", 1, 45.0, 70));
        activeBuses.put("302", new Bus("302", "R3", 3, 33.0, 70));

        activeBuses.values().forEach(crowdService::updateBusCrowd);

        // Traffic simulation: randomly delay buses every 30s
        executor.scheduleAtFixedRate(
            this::simulateTraffic, 0, 30, TimeUnit.SECONDS
        );

        System.out.printf("🚌 Simulation started with %d buses%n", activeBuses.size());
    }

    // Runs every 3 seconds — each bus moves on its own thread
    @Scheduled(fixedDelay = 3000)
    public void simulateBusMovement() {
        activeBuses.values().forEach(bus ->
            executor.submit(() -> moveBus(bus))
        );
    }

    private void moveBus(Bus bus) {
        // synchronized prevents race conditions when two threads update same bus
        synchronized (bus) {
            Route route = routeDataService.getRoute(bus.getRouteId());
            if (route == null) return;

            // distance = speed × time    (3 seconds = 3/3600 hours)
            double covered  = bus.getSpeedKmh() * (3.0 / 3600.0);
            double newDist  = bus.getDistanceToNextStop() - covered;

            if (newDist <= 0) {
                int nextStop = bus.getCurrentStopIndex() + 1;
                bus.setCurrentStopIndex(nextStop >= route.getStopCount() ? 0 : nextStop);

                double spacing = route.getTotalDistanceKm() / (route.getStopCount() - 1);
                bus.setDistanceToNextStop(spacing);
                crowdService.updateBusCrowd(bus);

                System.out.printf("Bus %s → %s%n",
                    bus.getBusId(),
                    route.getStopAt(bus.getCurrentStopIndex()).getName());
            } else {
                bus.setDistanceToNextStop(newDist);
            }
            bus.setLastUpdated(System.currentTimeMillis());
        }
    }

    private void simulateTraffic() {
        Random rng = new Random();
        activeBuses.values().forEach(bus -> {
            boolean jam = rng.nextDouble() < 0.20; // 20% chance of delay
            bus.setDelayed(jam);
            bus.setSpeedKmh(jam
                ? 10 + rng.nextDouble() * 10   // delayed: 10-20 km/h
                : 30 + rng.nextDouble() * 20   // normal:  30-50 km/h
            );
        });
    }

    public Map<String, Bus>   getAllBuses()               { return Collections.unmodifiableMap(activeBuses); }
    public Bus                getBus(String busId)        { return activeBuses.get(busId); }
    public Collection<Bus>    getBusesOnRoute(String rid) {
        return activeBuses.values().stream()
            .filter(b -> b.getRouteId().equals(rid)).toList();
    }
}
