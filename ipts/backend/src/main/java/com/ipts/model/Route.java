package com.ipts.model;

import java.util.List;

public class Route {
    private String id;
    private String name;
    private List<Stop> stops;
    private double totalDistanceKm;

    public Route(String id, String name, List<Stop> stops, double totalDistanceKm) {
        this.id               = id;
        this.name             = name;
        this.stops            = stops;
        this.totalDistanceKm  = totalDistanceKm;
    }

    public int   getStopCount()              { return stops.size(); }
    public Stop  getStopAt(int index)        { return (index >= 0 && index < stops.size()) ? stops.get(index) : null; }
    public String getId()                    { return id; }
    public String getName()                  { return name; }
    public List<Stop> getStops()             { return stops; }
    public double getTotalDistanceKm()       { return totalDistanceKm; }
}
