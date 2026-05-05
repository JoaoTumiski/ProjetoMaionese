import { StyleSheet } from 'react-native';
import Theme from '../../styles/theme';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background, justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center' },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: Theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  logoLetter: {
    fontFamily: Theme.typography.fontFamily,
    color: '#fff',
    fontSize: 48,
    fontWeight: '700',
  },
  appName: {
    fontFamily: Theme.typography.fontFamily,
    fontSize: 28,
    fontWeight: '700',
    color: Theme.colors.text,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  sub: {
    fontFamily: Theme.typography.fontFamily,
    marginTop: 12,
    fontSize: 14,
    color: Theme.colors.textMuted,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
