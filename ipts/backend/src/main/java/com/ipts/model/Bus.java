package com.ipts.model;

public class Bus {
    private String  busId;
    private String  routeId;
    private int     currentStopIndex;
    private double  speedKmh;
    private double  distanceToNextStop;
    private boolean isDelayed;
    private int     crowdCount;
    private int     maxCapacity;
    private long    lastUpdated;

    public Bus(String busId, String routeId, int initialStopIndex, double speedKmh, int maxCapacity) {
        this.busId              = busId;
        this.routeId            = routeId;
        this.currentStopIndex   = initialStopIndex;
        this.speedKmh           = speedKmh;
        this.maxCapacity        = maxCapacity;
        this.distanceToNextStop = 1.5;
        this.isDelayed          = false;
        this.crowdCount         = 0;
        this.lastUpdated        = System.currentTimeMillis();
    }

    public boolean isOvercrowded()      { return crowdCount > (maxCapacity * 0.8); }
    public double  getCrowdPercentage() { return (double) crowdCount / maxCapacity * 100; }
    public String  getCrowdLevel() {
        double pct = getCrowdPercentage();
        if (pct > 80) return "HIGH";
        if (pct > 50) return "MEDIUM";
        return "LOW";
    }

    // Getters
    public String  getBusId()               { return busId; }
    public String  getRouteId()             { return routeId; }
    public int     getCurrentStopIndex()    { return currentStopIndex; }
    public double  getSpeedKmh()            { return speedKmh; }
    public double  getDistanceToNextStop()  { return distanceToNextStop; }
    public boolean isDelayed()              { return isDelayed; }
    public int     getCrowdCount()          { return crowdCount; }
    public int     getMaxCapacity()         { return maxCapacity; }
    public long    getLastUpdated()         { return lastUpdated; }

    // Setters
    public void setCurrentStopIndex(int idx)     { this.currentStopIndex   = idx; }
    public void setSpeedKmh(double speed)         { this.speedKmh           = speed; }
    public void setDistanceToNextStop(double dist){ this.distanceToNextStop = dist; }
    public void setDelayed(boolean delayed)       { this.isDelayed          = delayed; }
    public void setCrowdCount(int count)          { this.crowdCount         = count; }
    public void setLastUpdated(long ts)           { this.lastUpdated        = ts; }
}
