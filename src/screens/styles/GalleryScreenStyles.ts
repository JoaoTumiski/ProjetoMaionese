import { StyleSheet } from 'react-native';
import Theme from '../../styles/theme';

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
  back: {
    fontFamily: Theme.typography.fontFamily,
    color: Theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontFamily: Theme.typography.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  list: { padding: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  coverBox: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 16,
    backgroundColor: Theme.colors.surfaceLight,
  },
  cover: { width: '100%', height: '100%' },
  cardInfo: { flex: 1 },
  cardTitle: {
    fontFamily: Theme.typography.fontFamily,
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  cardSub: {
    fontFamily: Theme.typography.fontFamily,
    color: Theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  chevron: {
    color: Theme.colors.textMuted,
    fontSize: 20,
    fontWeight: '300',
  },
});
