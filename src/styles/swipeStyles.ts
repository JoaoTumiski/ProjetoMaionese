// src/styles/swipeStyles.ts
import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const CARD_WIDTH = Math.min(380, width - 40);
export const CARD_HEIGHT = Math.min(520, height * 0.64);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    height: 66,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  back: { color: '#0b63d6', fontWeight: '700' },
  counters: { flexDirection: 'row', alignItems: 'center' },
  counterText: { color: '#444', fontWeight: '700', fontSize: 15 },
  undo: { color: '#ff6b6b', fontWeight: '700' },

  deckWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 18 },

  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 14,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    overflow: 'hidden',
  },

  image: { width: '100%', height: '100%', backgroundColor: '#f0f0f0' },

  cardFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  cardTitle: { color: '#fff', fontWeight: '700' },

  hint: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
    paddingHorizontal: 18,
  },
  hintText: { color: '#666', textAlign: 'center' },
  hintTextSmall: { color: '#9aa4b2', textAlign: 'center', marginTop: 6 },

  emptyWrap: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 20, fontWeight: '700', marginBottom: 8 },

  debugRow: {
    height: 76,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
    paddingVertical: 10,
  },
  debugScroll: { paddingHorizontal: 12, alignItems: 'center', gap: 12 },
  debugBtn: {
    minWidth: 120,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#0b63d6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  debugText: { color: '#fff', fontWeight: '700' },
  debugDisabled: { backgroundColor: '#cfe0ff' },

  finalCardWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18 },
  finalCard: {
    width: CARD_WIDTH,
    borderRadius: 14,
    padding: 20,
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  finalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  finalBody: { color: '#555', textAlign: 'center', marginBottom: 16 },
  finalActions: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  primaryBtn: {
    backgroundColor: '#0b63d6',
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  ghostBtn: {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  ghostBtnText: { color: '#444' },
});

export default styles;