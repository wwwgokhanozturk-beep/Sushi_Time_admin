import React, { useMemo } from 'react';
import {
  Typography, Box, Card, CardContent, Grid, Chip, List, ListItem,
  ListItemText, CircularProgress, Alert,
} from '@mui/material';
import PageLayout from '@/components/layout/PageLayout';
import MapboxDriverMap from '@/components/map/MapboxDriverMap';
import { useDrivers } from '@/hooks/useDrivers';
import { useDriverLocations } from '@/hooks/useDriverLocation';
import dayjs from 'dayjs';

const STATUS_LABELS = { offline: 'Çevrimdışı', available: 'Müsait', busy: 'Teslimatta' };
const STATUS_COLORS = { offline: 'default', available: 'success', busy: 'warning' };

export default function DriversMapPage() {
  const { data: drivers, isLoading, isError } = useDrivers();
  const liveLocations = useDriverLocations();

  // The socket position always wins over the throttled copy from the database.
  const merged = useMemo(
    () =>
      (drivers || []).map((driver) => {
        const live = liveLocations[driver._id];
        return {
          ...driver,
          lastLocation: live
            ? { lat: live.lat, lng: live.lng, updatedAt: live.updatedAt }
            : driver.lastLocation,
          isLive: !!live,
        };
      }),
    [drivers, liveLocations],
  );

  const onMap = merged.filter((d) => d.lastLocation?.lat);

  return (
    <PageLayout title="Kurye Haritası">
      {isError && <Alert severity="error" sx={{ mb: 2 }}>Kuryeler yüklenemedi.</Alert>}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <MapboxDriverMap drivers={onMap} />
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Kuryeler ({merged.length})
                </Typography>

                {merged.length === 0 ? (
                  <Typography color="text.secondary" variant="body2">
                    Henüz kurye yok. Kullanıcılar sayfasından bir kullanıcıya "driver" rolü verin.
                  </Typography>
                ) : (
                  <List dense disablePadding>
                    {merged.map((driver) => (
                      <ListItem key={driver._id} disableGutters sx={{ alignItems: 'flex-start' }}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Typography variant="body2" fontWeight={700}>{driver.name}</Typography>
                              <Chip
                                size="small"
                                label={STATUS_LABELS[driver.driverStatus] || driver.driverStatus}
                                color={STATUS_COLORS[driver.driverStatus] || 'default'}
                              />
                              {driver.isLive && <Chip size="small" color="success" variant="outlined" label="canlı" />}
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {driver.activeOrderCount > 0
                                  ? `${driver.activeOrderCount} aktif sipariş`
                                  : 'Aktif sipariş yok'}
                              </Typography>
                              {driver.lastLocation?.updatedAt && (
                                <Typography variant="caption" color="text.secondary">
                                  Son konum: {dayjs(driver.lastLocation.updatedAt).format('HH:mm:ss')}
                                </Typography>
                              )}
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </PageLayout>
  );
}
