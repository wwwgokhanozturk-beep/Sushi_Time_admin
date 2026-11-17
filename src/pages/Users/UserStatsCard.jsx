import React from 'react';
import { Alert, Box, Card, CardContent, Grid, Skeleton, Typography } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { userService } from '@/services/userService';
import { PLATFORM_ICONS, PLATFORM_ICON_COLORS } from '@/pages/Orders/components/OrderPlatformChip';

// Who uses Sushi Time and from where (GET /admin/user-stats): one tile per
// platform — registered accounts, devices active in the period, people who
// ordered and phones with notifications, each split into "hesaplı" (signed
// in) and "misafir" (no account). Accounts and phones from before the
// platform was recorded get their own tile until their owners come back.
const PLATFORMS = [
  { key: 'web', title: 'Web sitesi', subtitle: 'sushitimetr.com' },
  { key: 'ios', title: 'App Store', subtitle: 'iPhone uygulaması' },
  { key: 'android', title: 'Play Market', subtitle: 'Android uygulaması' },
];

const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('tr-TR'));
const split = (account, guest) => `hesaplı ${fmt(account)} · misafir ${fmt(guest)}`;

function StatRow({ label, value, detail }) {
  return (
    <Box sx={{ py: 1, borderTop: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h6" component="span" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1.3 }}>
          {value}
        </Typography>
      </Box>
      {detail && (
        <Typography variant="caption" color="text.secondary" component="div">{detail}</Typography>
      )}
    </Box>
  );
}

function PlatformTile({ icon, title, subtitle, children, muted = false, footnote }) {
  return (
    <Box
      sx={{
        height: '100%', p: 2, borderRadius: '16px',
        border: '1px solid', borderColor: 'divider', borderStyle: muted ? 'dashed' : 'solid',
        bgcolor: muted ? '#FAFAFA' : 'background.paper',
        display: 'flex', flexDirection: 'column',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1 }}>
        {icon}
        <Box sx={{ minWidth: 0 }}>
          <Typography fontWeight={700} lineHeight={1.2}>{title}</Typography>
          <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
        </Box>
      </Box>
      {children}
      {footnote && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 'auto', pt: 1 }}>{footnote}</Typography>
      )}
    </Box>
  );
}

function TileSkeleton() {
  return (
    <Box sx={{ p: 2, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
      <Skeleton width="60%" height={28} />
      {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={36} />)}
    </Box>
  );
}

export default function UserStatsCard() {
  const { data: s, isLoading, isError } = useQuery({
    queryKey: ['adminUserStats'],
    queryFn: () => userService.getUserStats().then((r) => r.data.data),
    staleTime: 60_000,
  });

  const days = s?.days ?? 30;
  const unknownAccounts = s?.accounts.byPlatform.unknown ?? 0;
  const unknownPhones = s?.push.byPlatform.unknown ?? 0;
  const unknownOrders = s?.orders.byPlatform.unknown;
  const showUnknown = unknownAccounts + unknownPhones + (unknownOrders?.total ?? 0) > 0;
  const appDevices = (s?.active.byPlatform.ios.total ?? 0) + (s?.active.byPlatform.android.total ?? 0);
  const countingSince = s?.active.countingSince ? dayjs(s.active.countingSince) : null;

  const notes = [];
  if (s) {
    if (s.accounts.estimated > 0) {
      notes.push(`Kayıt yeri yeni hesaplarda yazılıyor; ${fmt(s.accounts.estimated)} eski hesabın yeri ilk siparişinden ya da cihazından tahmin edildi.`);
    }
    if (!countingSince) {
      notes.push('Aktif cihaz sayımı yeni başlıyor: sitede hemen, uygulamada güncellemeden sonra.');
    } else if (countingSince.isAfter(dayjs(s.since))) {
      notes.push(`Aktif cihazlar ${countingSince.format('DD.MM.YYYY')} tarihinden beri sayılıyor${appDevices === 0 ? '; uygulamada güncellemeden sonra başlar' : ''}.`);
    } else if (appDevices === 0) {
      notes.push('Uygulamadaki cihazlar güncellemeden sonra sayılmaya başlar.');
    }
    if (s.push.total > 0) {
      // Phones that stopped opening the app may have deleted it: the real
      // reach of a broadcast is closer to the second number.
      notes.push(`Bildirimi açık telefonlar: ${fmt(s.push.total)}, bunlardan son ${days} günde uygulamayı açan: ${fmt(s.push.openedInPeriod)}.`);
    }
    if (s.accounts.guestAccounts > 0) {
      notes.push(`Ayrıca ${fmt(s.accounts.guestAccounts)} misafir hesabı var: sitede hesap açmadan sohbet eden ya da siparişini takip eden ziyaretçilere otomatik açılır. Kayıtlı müşteri sayılmaz, listede gizlidir.`);
    }
  }

  return (
    <Card elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 3, mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 1, mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>Kim, nereden kullanıyor</Typography>
          {s && (
            <Typography variant="body2" color="text.secondary">
              <strong>{fmt(s.accounts.total)}</strong> kayıtlı müşteri · son {days} günde <strong>{fmt(s.accounts.newInPeriod)}</strong> yeni
            </Typography>
          )}
        </Box>

        {isError && <Alert severity="warning">İstatistik yüklenemedi</Alert>}

        <Grid container spacing={2}>
          {isLoading && [0, 1, 2, 3].map((i) => (
            <Grid item xs={12} sm={6} lg={3} key={i}><TileSkeleton /></Grid>
          ))}

          {s && PLATFORMS.map(({ key, title, subtitle }) => {
            const Icon = PLATFORM_ICONS[key];
            const active = s.active.byPlatform[key];
            const orders = s.orders.byPlatform[key];
            return (
              <Grid item xs={12} sm={6} lg={3} key={key}>
                <PlatformTile
                  icon={<Icon sx={{ fontSize: 28, color: PLATFORM_ICON_COLORS[key] }} />}
                  title={title}
                  subtitle={subtitle}
                >
                  <StatRow label="Kayıtlı hesap" value={fmt(s.accounts.byPlatform[key])} />
                  <StatRow
                    label={`Aktif cihaz, ${days} gün`}
                    value={fmt(active.total)}
                    detail={split(active.account, active.guest)}
                  />
                  <StatRow
                    label={`Sipariş veren, ${days} gün`}
                    value={fmt(orders.people)}
                    detail={`${split(orders.accountPeople, orders.guestPeople)} · ${fmt(orders.total)} sipariş`}
                  />
                  <StatRow
                    label="Bildirimi açık telefon"
                    value={key === 'web' ? '—' : fmt(s.push.byPlatform[key])}
                    detail={key === 'web' ? 'sitede bildirim yok' : null}
                  />
                </PlatformTile>
              </Grid>
            );
          })}

          {s && showUnknown && (
            <Grid item xs={12} sm={6} lg={3}>
              {/* Same rows in the same order as the platform tiles, so the
                  numbers line up across the row. */}
              <PlatformTile
                muted
                icon={<HelpOutlineIcon sx={{ fontSize: 28, color: 'text.disabled' }} />}
                title="Henüz bilinmiyor"
                subtitle="eski kayıtlar"
                footnote="Platform yazılmadan önceki hesaplar ve telefonlar. Sahipleri siteyi ya da uygulamayı açtıkça doğru platforma geçer."
              >
                <StatRow label="Kayıtlı hesap" value={fmt(unknownAccounts)} />
                <StatRow label={`Aktif cihaz, ${days} gün`} value="—" />
                <StatRow
                  label={`Sipariş veren, ${days} gün`}
                  value={unknownOrders?.total ? fmt(unknownOrders.people) : '—'}
                  detail={unknownOrders?.total ? `${split(unknownOrders.accountPeople, unknownOrders.guestPeople)} · ${fmt(unknownOrders.total)} sipariş` : null}
                />
                <StatRow label="Bildirimi açık telefon" value={fmt(unknownPhones)} />
              </PlatformTile>
            </Grid>
          )}
        </Grid>

        {notes.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, mt: 2, color: 'text.secondary' }}>
            <InfoOutlinedIcon sx={{ fontSize: 18, mt: '2px' }} />
            <Box>
              {notes.map((n) => (
                <Typography key={n} variant="caption" component="p" sx={{ m: 0 }}>{n}</Typography>
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
