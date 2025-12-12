import React, { useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';

const { width } = Dimensions.get('window');

type Props = {
  onBack: () => void;
  onDonate: (amount: number) => void;
};

const PRESETS = [1, 3, 5];

export default function DonateScreen({ onBack, onDonate }: Props) {
  const [custom, setCustom] = useState<string>('');
  const [loadingAmount, setLoadingAmount] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const pulse = useRef(new Animated.Value(1)).current;

  const selectedAmount = useMemo(() => {
    if (selected) return selected;
    const parsed = parseFloat(custom.replace(',', '.'));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [selected, custom]);

  function startPulse() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }
  function stopPulse() {
    pulse.stopAnimation();
    pulse.setValue(1);
  }

  function confirmAndDonate(amount: number) {
    if (!(amount > 0)) {
      Alert.alert('Valor inválido', 'Informe um valor de doação maior que zero.');
      return;
    }

    // exibir agradecimento discreto para doações maiores
    const extraThanks = amount >= 3 ? '\n\nAgradecemos muito pelo suporte — significa muito para nós.' : '';

    setLoadingAmount(amount);
    Alert.alert(
      'Confirmar doação',
      `Deseja confirmar a doação de R$ ${amount.toFixed(2)}?${extraThanks}`,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => setLoadingAmount(null) },
        {
          text: 'Confirmar',
          onPress: () => {
            onDonate(amount);
            setLoadingAmount(null);
          },
        },
      ],
      { cancelable: true }
    );
  }

  function handlePreset(amount: number) {
    setSelected(amount);
    startPulse();
    // small delay to show selection state before confirm modal
    setTimeout(() => confirmAndDonate(amount), 220);
  }

  function handleCustom() {
    const parsed = parseFloat(custom.replace(',', '.'));
    if (Number.isNaN(parsed) || parsed <= 0) {
      Alert.alert('Valor inválido', 'Digite um valor numérico maior que zero.');
      return;
    }
    setSelected(null);
    startPulse();
    setTimeout(() => confirmAndDonate(parsed), 220);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Apoie o desenvolvimento</Text>

        <Text style={styles.body}>
          Todas as doações removem anúncios permanentemente e ativam as mesmas bonificações no app.
          Obrigado por considerar apoiar o projeto.
        </Text>

        <View style={styles.presetWrap}>
          {PRESETS.map(p => {
            const active = selected === p;
            return (
              <TouchableOpacity
                key={p}
                style={[styles.presetButton, active && styles.presetButtonActive]}
                onPress={() => handlePreset(p)}
                accessibilityLabel={`Doar ${p} reais`}
              >
                <Text style={[styles.presetText, active && styles.presetTextActive]}>R$ {p}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.customRow}>
          <TextInput
            style={styles.input}
            placeholder="Outro valor (ex: 2.50)"
            keyboardType="decimal-pad"
            value={custom}
            onChangeText={text => {
              setCustom(text);
              setSelected(null);
            }}
            accessibilityLabel="Campo para outro valor de doação"
            returnKeyType="done"
            onSubmitEditing={handleCustom}
          />
          <Animated.View style={{ transform: [{ scale: pulse }] }}>
            <TouchableOpacity style={styles.customBtn} onPress={handleCustom}>
              <Text style={styles.customBtnText}>Doar</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={styles.noteBox}>
          <Text style={styles.noteTitle}>Observações</Text>
          <Text style={styles.noteText}>
            Todas as doações recebem as mesmas bonificações: remoção permanente de anúncios e benefícios
            dentro do app. Doações maiores significam muito para nós — agradecemos imensamente o apoio.
          </Text>
        </View>

        {loadingAmount !== null && (
          <Text style={styles.loadingText}>Confirmando doação R$ {loadingAmount.toFixed(2)}...</Text>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerHint}>
          O pagamento será processado pela loja do dispositivo (IAP). Você será notificado ao concluir.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const CARD_WIDTH = Math.min(760, width - 48);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { height: 64, paddingHorizontal: 20, justifyContent: 'center' },
  backText: { color: '#0b63d6', fontSize: 16, fontWeight: '600' },

  content: { flex: 1, paddingHorizontal: 20, paddingTop: 6 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8, textAlign: 'left' },
  body: { color: '#444', fontSize: 15, marginBottom: 18, maxWidth: CARD_WIDTH },

  presetWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  presetButton: {
    flex: 1,
    marginHorizontal: 6,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#f2f6fb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e6eefc',
  },
  presetButtonActive: {
    backgroundColor: '#0b63d6',
    borderColor: '#0b63d6',
    shadowColor: '#0b63d6',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  presetText: { color: '#0b63d6', fontWeight: '700', fontSize: 15 },
  presetTextActive: { color: '#fff' },

  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e6eefc',
    paddingHorizontal: 12,
    fontSize: 15,
    backgroundColor: '#fbfdff',
  },
  customBtn: {
    marginLeft: 8,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#0b63d6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customBtnText: { color: '#fff', fontWeight: '700' },

  noteBox: {
    marginTop: 6,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f7f9fc',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#eef5ff',
  },
  noteTitle: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  noteText: { color: '#555', fontSize: 14 },

  loadingText: { marginTop: 12, color: '#333', fontWeight: '600', textAlign: 'center' },

  footer: {
    padding: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#f0f0f0',
  },
  footerHint: { textAlign: 'center', color: '#9aa4b2', fontSize: 13 },
});