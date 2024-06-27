import { ShortTextInput } from './ShortTextInput';
import { isMobile } from '@/utils/isMobileSignal';
import { Show, createSignal, onMount, Setter } from 'solid-js';
import { SendButton } from '@/components/buttons/SendButton';
import { FileEvent, UploadsConfig } from '@/components/Bot';
import { ImageUploadButton } from '@/components/buttons/ImageUploadButton';
import { RecordAudioButton } from '@/components/buttons/RecordAudioButton';

type Props = {
  placeholder?: string;
  backgroundColor?: string;
  textColor?: string;
  sendButtonColor?: string;
  defaultValue?: string;
  fontSize?: number;
  disabled?: boolean;
  onSubmit: (value: string) => void;
  uploadsConfig?: Partial<UploadsConfig>;
  setPreviews: Setter<unknown[]>;
  onMicrophoneClicked: () => void;
  handleFileChange: (event: FileEvent<HTMLInputElement>) => void;
  maxChars?: number;
  maxCharsWarningMessage?: string;
  autoFocus?: boolean;
  sendMessageSound?: boolean;
  sendSoundLocation?: string;
};

const defaultBackgroundColor = '#ffffff';
const defaultTextColor = '#303235';
const defaultSendSound = 'https://cdn.jsdelivr.net/gh/FlowiseAI/FlowiseChatEmbed@latest/src/assets/send_message.mp3';

export const TextInput = (props: Props) => {
  const [inputValue, setInputValue] = createSignal(props.defaultValue ?? '');
  const [isSendButtonDisabled, setIsSendButtonDisabled] = createSignal(false);
  const [warningMessage, setWarningMessage] = createSignal('');

  let inputRef: HTMLInputElement | undefined;
  let fileUploadRef: HTMLInputElement | undefined;
  let audioRef: HTMLAudioElement | undefined;

  const handleInput = (newValue: string) => {
    const wordCount = newValue.length;

    if (props.maxChars && wordCount > props.maxChars) {
      setWarningMessage(props.maxCharsWarningMessage ?? `You exceeded the characters limit. Please input less than ${props.maxChars} characters.`);
      setIsSendButtonDisabled(true);
    } else {
      setInputValue(newValue);
      setWarningMessage('');
      setIsSendButtonDisabled(false);
    }
  };

  const checkIfInputIsValid = () => inputValue() !== '' && warningMessage() === '' && inputRef?.reportValidity();

  const submit = () => {
    if (checkIfInputIsValid()) {
      props.onSubmit(inputValue());
      if (props.sendMessageSound && audioRef) {
        audioRef.play();
      }
      setInputValue('');
    }
  };

  const submitWhenEnter = (e: KeyboardEvent) => {
    const isIMEComposition = e.isComposing || e.keyCode === 229;
    if (e.key === 'Enter' && !isIMEComposition && warningMessage() === '') {
      submit();
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Backspace') {
      deleteCharacter();
    }
  };

  const deleteCharacter = () => {
    const currentInputValue = inputValue();
    const cursorPosition = inputRef?.selectionStart ?? 0;

    if (cursorPosition > 0) {
      const newValue = currentInputValue.slice(0, cursorPosition - 1) + currentInputValue.slice(cursorPosition);
      setInputValue(newValue);
      inputRef?.setSelectionRange(cursorPosition - 1, cursorPosition - 1);
    }
  };

  onMount(() => {
    const shouldAutoFocus = props.autoFocus !== undefined ? props.autoFocus : !isMobile() && window.innerWidth > 640;

    if (!props.disabled && shouldAutoFocus && inputRef) {
      inputRef.focus();
    }

    if (props.sendMessageSound) {
      if (props.sendSoundLocation) {
        audioRef = new Audio(props.sendSoundLocation);
      } else {
        audioRef = new Audio(defaultSendSound);
      }
    }
  });

  const handleImageUploadClick = () => {
    if (fileUploadRef) fileUploadRef.click();
  };

  const handleFileChange = (event: FileEvent<HTMLInputElement>) => {
    props.handleFileChange(event);
    if (event.target) event.target.value = '';
  };

  return (
    <div
      class="w-full h-auto max-h-[192px] min-h-[56px] flex flex-col items-end justify-between chatbot-input border border-[#eeeeee]"
      data-testid="input"
      style={{
        margin: 'auto',
        'background-color': props.backgroundColor ?? defaultBackgroundColor,
        color: props.textColor ?? defaultTextColor,
      }}
    >
      <Show when={warningMessage() !== ''}>
        <div class="w-full px-4 pt-4 pb-1 text-red-500 text-sm" data-testid="warning-message">
          {warningMessage()}
        </div>
      </Show>
      <div class="w-full flex items-end justify-between">
        {props.uploadsConfig?.isImageUploadAllowed ? (
          <>
            <ImageUploadButton
              buttonColor={props.sendButtonColor}
              type="button"
              class="m-0 h-14 flex items-center justify-center"
              isDisabled={props.disabled || isSendButtonDisabled()}
              on:click={handleImageUploadClick}
            >
              <span style={{ 'font-family': 'Poppins, sans-serif' }}>Image Upload</span>
            </ImageUploadButton>
            <input style={{ display: 'none' }} multiple ref={fileUploadRef as HTMLInputElement} type="file" onChange={handleFileChange} />
          </>
        ) : null}
        <ShortTextInput
          ref={(el) => (inputRef = el as HTMLInputElement)}
          onInput={handleInput}
          value={inputValue()}
          fontSize={props.fontSize}
          disabled={props.disabled}
          placeholder={props.placeholder ?? 'Type your question'}
          onKeyDown={submitWhenEnter}
          onKeyPress={handleKeyPress}
        />
        {props.uploadsConfig?.isSpeechToTextEnabled ? (
          <RecordAudioButton
            buttonColor={props.sendButtonColor}
            type="button"
            class="m-0 start-recording-button h-14 flex items-center justify-center"
            isDisabled={props.disabled || isSendButtonDisabled()}
            on:click={props.onMicrophoneClicked}
          >
            <span style={{ 'font-family': 'Poppins, sans-serif' }}>Record Audio</span>
          </RecordAudioButton>
        ) : null}
        <SendButton
          sendButtonColor={props.sendButtonColor}
          type="button"
          isDisabled={props.disabled || isSendButtonDisabled()}
          class="m-0 h-14 flex items-center justify-center"
          on:click={submit}
        >
          <span style={{ 'font-family': 'Poppins, sans-serif' }}>Send</span>
        </SendButton>
      </div>
    </div>
  );
};
