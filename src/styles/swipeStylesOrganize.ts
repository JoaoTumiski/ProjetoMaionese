import { StyleSheet, Dimensions } from 'react-native';
import Theme from './theme';

const { width, height } = Dimensions.get('window');

export const CARD_WIDTH = Math.min(220, width - 80);
export const CARD_HEIGHT = Math.min(380, height * 0.48);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },

  header: {
    height: 70,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: Theme.colors.border,
  },

  headerRightRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  back: {
    fontFamily: Theme.typography.fontFamily,
    color: Theme.colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  counters: { flexDirection: 'row', alignItems: 'center' },
  counterText: {
    fontFamily: Theme.typography.fontFamily,
    color: Theme.colors.text,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 1,
  },
  undo: {
    fontFamily: Theme.typography.fontFamily,
    color: Theme.colors.danger,
    fontWeight: '600',
    fontSize: 16,
  },

  deckWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },

  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: Theme.radius.xxl,
    backgroundColor: Theme.colors.surface,
    shadowColor: Theme.colors.primaryContainer,
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },

  image: { width: '100%', height: '100%', backgroundColor: Theme.colors.surfaceLight },

  cardFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    backgroundColor: 'rgba(19, 19, 22, 0.8)',
  },
  cardTitle: {
    fontFamily: Theme.typography.fontFamily,
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },

  hint: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 20,
  },
  hintText: {
    fontFamily: Theme.typography.fontFamily,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    fontSize: 14,
  },
  hintTextSmall: {
    fontFamily: Theme.typography.fontFamily,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    fontSize: 12,
    letterSpacing: 0.5,
  },

  emptyWrap: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: {
    fontFamily: Theme.typography.fontFamily,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    color: Theme.colors.text,
  },

  finalCardWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  finalCard: {
    width: CARD_WIDTH,
    borderRadius: Theme.radius.xxl,
    padding: 32,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
  },
  finalIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Theme.colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  finalTitle: {
    fontFamily: Theme.typography.fontFamily,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    color: Theme.colors.text,
  },
  finalBody: {
    fontFamily: Theme.typography.fontFamily,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  finalActions: { flexDirection: 'row', justifyContent: 'center', gap: 16, width: '100%' },

  primaryBtn: {
    backgroundColor: Theme.colors.primaryContainer,
    height: 54,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  ghostBtn: {
    height: 54,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  ghostBtnText: { color: Theme.colors.textSecondary, fontWeight: '600' },

  /* -------------------------
     Organize screen specific
     -------------------------*/

  albumsSection: { marginTop: 24 },

  albumsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  albumsTitle: {
    fontFamily: Theme.typography.fontFamily,
    fontWeight: '700',
    fontSize: 16,
    color: Theme.colors.text,
    letterSpacing: 0.5,
  },

  createAlbumBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Theme.colors.surfaceLight,
  },
  createAlbumBtnText: {
    fontFamily: Theme.typography.fontFamily,
    color: Theme.colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  createAlbumBtnTextOn: {
    fontFamily: Theme.typography.fontFamily,
    color: Theme.colors.success,
    fontWeight: '700',
    fontSize: 13,
  },

  albumsScrollWrap: { height: 140 },
  albumsScrollContent: { paddingHorizontal: 20, alignItems: 'center' },

  albumItem: { width: 100, marginRight: 16, alignItems: 'center' },
  albumThumbWrap: {
    width: 90,
    height: 90,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Theme.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  albumThumbWrapSelected: {
    borderColor: Theme.colors.primary,
    borderWidth: 3,
  },
  albumTitle: {
    fontFamily: Theme.typography.fontFamily,
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.text,
    textAlign: 'center',
  },
  albumCount: {
    fontFamily: Theme.typography.fontFamily,
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },

  /* Modal create album */
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.overlay,
  },
  modalInner: {
    width: '85%',
    backgroundColor: Theme.colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  modalHeading: {
    fontFamily: Theme.typography.fontFamily,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: Theme.colors.text,
  },
  modalAssetPreviewWrap: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: Theme.colors.surfaceLight,
  },
  modalTextInput: {
    height: 56,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
    color: Theme.colors.text,
    backgroundColor: Theme.colors.surfaceLight,
    fontFamily: Theme.typography.fontFamily,
  },
  modalActionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
  modalCancelText: {
    fontFamily: Theme.typography.fontFamily,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  modalCreateText: {
    fontFamily: Theme.typography.fontFamily,
    color: Theme.colors.primary,
    fontWeight: '700',
  },

  centerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});

export default styles;