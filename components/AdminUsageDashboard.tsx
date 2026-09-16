'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, TrendingUp, Users, Key, Zap } from 'lucide-react';

interface UsageStats {
  dashboard: {
    title: string;
    date: string;
    summary: Record<string, string | number>;
    capacity: Record<string, string>;
    models: Record<string, { tokens: number; requests: number }>;
    peakHours: Array<{ hour: string; tokens: string }>;
    alerts: string[];
  };
  keyManager: {
    totalKeys: number;
    availableKeys: number;
    currentKeyIndex: number;
    keyStatus: Array<{
      key: string;
      isAvailable: boolean;
      resetTime?: Date;
      usageCount: number;
      lastError?: string;
    }>;
  };
  recommendations: string[];
}

export default function AdminUsageDashboard() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/usage-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    if (autoRefresh) {
      const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="animate-spin mr-2" />
        Loading statistics...
      </div>
    );
  }

  if (!stats) {
    return (
      <Alert>
        <AlertDescription>Failed to load usage statistics</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{stats.dashboard.title}</h1>
          <p className="text-muted-foreground">Date: {stats.dashboard.date}</p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            fetchStats();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Alerts */}
      {stats.recommendations.length > 0 && (
        <div className="space-y-2">
          {stats.recommendations.map((alert, i) => (
            <Alert key={i} variant={alert.includes('🚨') ? 'destructive' : 'default'}>
              <AlertDescription>{alert}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dashboard.summary['Total Requests']}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dashboard.summary['Unique Users']}</div>
            <p className="text-xs text-muted-foreground">
              Peak: {stats.dashboard.summary['Peak Concurrent']} concurrent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dashboard.summary['Total Tokens']}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.keyManager.availableKeys}/{stats.keyManager.totalKeys}
            </div>
            <p className="text-xs text-muted-foreground">
              Available keys
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Capacity Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Capacity Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(stats.dashboard.capacity).map(([model, usage]) => {
            const percentage = parseFloat(usage.toString().match(/[\d.]+/)?.[0] || '0');
            return (
              <div key={model}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{model}</span>
                  <span className="text-sm text-muted-foreground">{usage}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      percentage >= 90
                        ? 'bg-red-500'
                        : percentage >= 70
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Model Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Model Usage Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.dashboard.models).map(([model, data]) => (
                <div key={model} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{model}</span>
                  <div className="text-right">
                    <div className="text-sm font-bold">{data.tokens.toLocaleString()} tokens</div>
                    <div className="text-xs text-muted-foreground">{data.requests} requests</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Peak Usage Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.dashboard.peakHours.map((hour, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{hour.hour}</span>
                  <Badge variant={i === 0 ? 'default' : 'secondary'}>
                    {hour.tokens} tokens
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Key Status */}
      <Card>
        <CardHeader>
          <CardTitle>API Key Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {stats.keyManager.keyStatus.map((key, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border text-center ${
                  key.isAvailable
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="text-xs font-medium">Key {i + 1}</div>
                <div className={`text-lg font-bold ${
                  key.isAvailable ? 'text-green-600' : 'text-red-600'
                }`}>
                  {key.isAvailable ? '✓' : '✗'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {key.usageCount} uses
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Stats */}
      <Card>
        <CardHeader>
          <CardTitle>System Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Key Rotations</div>
              <div className="text-2xl font-bold">{stats.dashboard.summary['Key Rotations']}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Rate Limit Hits</div>
              <div className="text-2xl font-bold">{stats.dashboard.summary['Rate Limit Hits']}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Current Load</div>
              <div className="text-2xl font-bold">{stats.dashboard.summary['Current Load']}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Current Key</div>
              <div className="text-2xl font-bold">#{stats.keyManager.currentKeyIndex}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
