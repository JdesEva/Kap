import electron from "electron";
import React from "react";
import PropTypes from "prop-types";
import tildify from "tildify";
import { connect, PreferencesContainer } from "../../../containers";
import Item from "../item";
import Switch from "../item/switch";
import Button from "../item/button";
import Select from "../item/select";
import ShortcutInput from "../shortcut-input";
import Category from "./category";
import i18n from '../../../i18n'

class General extends React.Component {
  static defaultProps = {
    audioDevices: [],
    kapturesDir: "",
    category: "general",
  };

  state = {};

  componentDidMount() {
    this.setState({
      showCursorSupported: electron.remote
        .require("macos-version")
        .isGreaterThanOrEqualTo("10.13"),
    });
  }

  openKapturesDir = () => {
    electron.shell.openPath(this.props.kapturesDir);
  };

  render() {
    const {
      kapturesDir,
      openOnStartup,
      allowAnalytics,
      showCursor,
      highlightClicks,
      record60fps,
      enableShortcuts,
      loopExports,
      toggleSetting,
      toggleRecordAudio,
      audioInputDeviceId,
      setAudioInputDeviceId,
      audioDevices,
      recordAudio,
      pickKapturesDir,
      setOpenOnStartup,
      updateShortcut,
      toggleShortcuts,
      category,
      lossyCompression,
      shortcuts,
      shortcutMap,
    } = this.props;

    const { showCursorSupported } = this.state;

    const devices = audioDevices.map((device) => ({
      label: device.name,
      value: device.id,
    }));

    const kapturesDirPath = tildify(kapturesDir);
    const tabIndex = category === "general" ? 0 : -1;
    const fpsOptions = [
      { label: "30 FPS", value: false },
      { label: "60 FPS", value: true },
    ];

    return (
      <Category>
        {showCursorSupported && (
          <Item
            key="showCursor"
            parentItem
            title={i18n.t("ShowCursor")}
            subtitle={i18n.t("ShowCursorInfo")}
          >
            <Switch
              tabIndex={tabIndex}
              checked={showCursor}
              onClick={() => {
                if (showCursor) {
                  toggleSetting("highlightClicks", false);
                }

                toggleSetting("showCursor");
              }}
            />
          </Item>
        )}
        {showCursorSupported && (
          <Item key="highlightClicks" title={i18n.t("Highlight")} subtitle={i18n.t("HighlightInfo")}>
            <Switch
              tabIndex={tabIndex}
              checked={highlightClicks}
              disabled={!showCursor}
              onClick={() => toggleSetting("highlightClicks")}
            />
          </Item>
        )}
        <Item
          key="enableShortcuts"
          parentItem
          title={i18n.t("KeyboardShortcuts")}
          subtitle={i18n.t("KeyboardShortcutsInfo")}
          help={i18n.t("KeyboardShortcutsHelp")}
        >
          <Switch
            tabIndex={tabIndex}
            checked={enableShortcuts}
            onClick={toggleShortcuts}
          />
        </Item>
        {enableShortcuts &&
          Object.entries(shortcutMap).map(([key, title]) => (
            <Item key={key} subtitle={title}>
              <ShortcutInput
                shortcut={shortcuts[key]}
                tabIndex={tabIndex}
                onChange={(shortcut) => updateShortcut(key, shortcut)}
              />
            </Item>
          ))}
        <Item
          key="loopExports"
          title={i18n.t("LoopExports")}
          subtitle={i18n.t("LoopExportsInfo")}
        >
          <Switch
            tabIndex={tabIndex}
            checked={loopExports}
            onClick={() => toggleSetting("loopExports")}
          />
        </Item>
        <Item
          key="recordAudio"
          parentItem
          title={i18n.t("AudioRecording")}
          subtitle={i18n.t("AudioRecordingInfo")}
        >
          <Switch
            tabIndex={tabIndex}
            checked={recordAudio}
            onClick={toggleRecordAudio}
          />
        </Item>
        {recordAudio && (
          <Item key="audioInputDeviceId" subtitle={i18n.t("AudioRecordingInput")}>
            <Select
              tabIndex={tabIndex}
              options={devices}
              selected={audioInputDeviceId}
              placeholder={i18n.t("AudioRecordingInputPlaceholder")}
              noOptionsMessage={i18n.t("AudioRecordingInputEmpty")}
              onSelect={setAudioInputDeviceId}
            />
          </Item>
        )}
        <Item
          key="record60fps"
          title={i18n.t("CaptureFrameRate")}
          subtitle={i18n.t("CaptureFrameRateInfo")}
        >
          <Select
            tabIndex={tabIndex}
            options={fpsOptions}
            selected={record60fps}
            onSelect={(value) => toggleSetting("record60fps", value)}
          />
        </Item>
        <Item
          key="allowAnalytics"
          title={i18n.t("AllowAnalytics")}
          subtitle={i18n.t("AllowAnalyticsInfo")}
        >
          <Switch
            tabIndex={tabIndex}
            checked={allowAnalytics}
            onClick={() => toggleSetting("allowAnalytics")}
          />
        </Item>
        <Item
          key="openOnStartup"
          title={i18n.t("StartAutomatically")}
          subtitle={i18n.t("StartAutomaticallyInfo")}
        >
          <Switch
            tabIndex={tabIndex}
            checked={openOnStartup}
            onClick={setOpenOnStartup}
          />
        </Item>
        <Item
          key="pickKapturesDir"
          title={i18n.t("SaveTo")}
          subtitle={kapturesDirPath}
          tooltip={kapturesDir}
          onSubtitleClick={this.openKapturesDir}
        >
          <Button
            tabIndex={tabIndex}
            title={i18n.t("Choose")}
            onClick={pickKapturesDir}
          />
        </Item>
        <Item
          key="lossyCompression"
          parentItem
          title={i18n.t("LossyGIF")}
          subtitle={i18n.t("LossyGIFInfo")}
        >
          <Switch
            tabIndex={tabIndex}
            checked={lossyCompression}
            onClick={() => toggleSetting("lossyCompression")}
          />
        </Item>
      </Category>
    );
  }
}

General.propTypes = {
  showCursor: PropTypes.bool,
  highlightClicks: PropTypes.bool,
  record60fps: PropTypes.bool,
  enableShortcuts: PropTypes.bool,
  toggleSetting: PropTypes.elementType.isRequired,
  toggleRecordAudio: PropTypes.elementType.isRequired,
  audioInputDeviceId: PropTypes.string,
  setAudioInputDeviceId: PropTypes.elementType.isRequired,
  audioDevices: PropTypes.array,
  recordAudio: PropTypes.bool,
  kapturesDir: PropTypes.string,
  openOnStartup: PropTypes.bool,
  allowAnalytics: PropTypes.bool,
  loopExports: PropTypes.bool,
  pickKapturesDir: PropTypes.elementType.isRequired,
  setOpenOnStartup: PropTypes.elementType.isRequired,
  updateShortcut: PropTypes.elementType.isRequired,
  toggleShortcuts: PropTypes.elementType.isRequired,
  category: PropTypes.string,
  shortcutMap: PropTypes.object,
  shortcuts: PropTypes.object,
  lossyCompression: PropTypes.bool,
};

export default connect(
  [PreferencesContainer],
  ({
    showCursor,
    highlightClicks,
    record60fps,
    recordAudio,
    enableShortcuts,
    audioInputDeviceId,
    audioDevices,
    kapturesDir,
    openOnStartup,
    allowAnalytics,
    loopExports,
    category,
    lossyCompression,
    shortcuts,
    shortcutMap,
  }) => ({
    showCursor,
    highlightClicks,
    record60fps,
    recordAudio,
    enableShortcuts,
    audioInputDeviceId,
    audioDevices,
    kapturesDir,
    openOnStartup,
    allowAnalytics,
    loopExports,
    category,
    lossyCompression,
    shortcuts,
    shortcutMap,
  }),
  ({
    toggleSetting,
    toggleRecordAudio,
    setAudioInputDeviceId,
    pickKapturesDir,
    setOpenOnStartup,
    updateShortcut,
    toggleShortcuts,
  }) => ({
    toggleSetting,
    toggleRecordAudio,
    setAudioInputDeviceId,
    pickKapturesDir,
    setOpenOnStartup,
    updateShortcut,
    toggleShortcuts,
  })
)(General);
