import { StyleSheet } from 'react-native';
import Theme from '../../styles/theme';

const THUMB = 60;

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: {
    height: 70,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: Theme.colors.border,
  },
  back: { color: Theme.colors.primary, fontSize: 16, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '700', color: Theme.colors.text },
  infoRow: { padding: 24 },
  infoText: { fontWeight: '700', color: Theme.colors.text, fontSize: 16 },
  list: { padding: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  thumb: { width: THUMB, height: THUMB, borderRadius: 12, marginRight: 16 },
  info: { flex: 1 },
  name: { fontWeight: '700', fontSize: 15, color: Theme.colors.text },
  date: { color: Theme.colors.textMuted, marginTop: 4, fontSize: 12 },
  restoreBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Theme.colors.primaryContainer,
  },
  restoreText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  footer: { padding: 24, borderTopWidth: 1, borderColor: Theme.colors.border },
  deleteAllBtn: {
    height: 64,
    borderRadius: 20,
    backgroundColor: Theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  deleteAllDisabled: { opacity: 0.5 },
  deleteAllText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: Theme.colors.textSecondary, fontSize: 16 },
});
