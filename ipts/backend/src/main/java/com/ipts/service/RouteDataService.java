package com.ipts.service;

import com.ipts.model.Route;
import com.ipts.model.Stop;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class RouteDataService {

    private final Map<String, Route> routes = new HashMap<>();

    @PostConstruct
    public void initRoutes() {

        // Route R1: Gandhipuram → RS Puram (8.5 km)
        List<Stop> r1 = Arrays.asList(
            new Stop("S01", "Gandhipuram Bus Stand", 11.0168, 76.9558),
            new Stop("S02", "Town Hall",             11.0117, 76.9660),
            new Stop("S03", "Peelamedu Junction",    11.0245, 77.0076),
            new Stop("S04", "Avinashi Road",         11.0201, 77.0168),
            new Stop("S05", "RS Puram",              11.0020, 76.9523)
        );
        routes.put("R1", new Route("R1", "Gandhipuram → RS Puram", r1, 8.5));

        // Route R2: Ukkadam → Tidel Park (10.2 km)
        List<Stop> r2 = Arrays.asList(
            new Stop("S10", "Ukkadam",        11.0001, 76.9700),
            new Stop("S11", "Sungam Circle",  11.0080, 76.9800),
            new Stop("S12", "Singanallur",    11.0000, 77.0200),
            new Stop("S13", "Brookefields",   11.0150, 77.0100),
            new Stop("S14", "Tidel Park",     11.0230, 77.0300)
        );
        routes.put("R2", new Route("R2", "Ukkadam → Tidel Park", r2, 10.2));

        // Route R3: Hopes College → Peelamedu (7.8 km)
        List<Stop> r3 = Arrays.asList(
            new Stop("S20", "Hopes College",     11.0250, 76.9600),
            new Stop("S21", "Ramanathapuram",    11.0300, 76.9650),
            new Stop("S22", "Saibaba Colony",    11.0350, 76.9550),
            new Stop("S23", "Race Course",       11.0290, 76.9480),
            new Stop("S24", "Peelamedu",         11.0245, 77.0076)
        );
        routes.put("R3", new Route("R3", "Hopes College → Peelamedu", r3, 7.8));
    }

    public Route              getRoute(String routeId)  { return routes.get(routeId); }
    public Map<String, Route> getAllRoutes()             { return Collections.unmodifiableMap(routes); }
}
