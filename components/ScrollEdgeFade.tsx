/**
 * ScrollEdgeFade — soft gradient masks at scroll edges so content dissolves
 * instead of looking harshly clipped against footers or headers.
 */
import { LinearGradient } from "expo-linear-gradient";
import {
  cloneElement,
  isValidElement,
  useCallback,
  useRef,
  useState,
  type ReactElement,
} from "react";
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
  View,
} from "react-native";

const SCROLL_EDGE_THRESHOLD = 8;
const DEFAULT_FADE_HEIGHT = 44;

type ScrollMetrics = {
  contentHeight: number;
  layoutHeight: number;
  scrollY: number;
};

type ScrollEdgeFadeProps = {
  edgeColor: string;
  fadeHeight?: number;
  children: ReactElement<ScrollViewProps>;
};

export function ScrollEdgeFade({
  edgeColor,
  fadeHeight = DEFAULT_FADE_HEIGHT,
  children,
}: ScrollEdgeFadeProps) {
  const metricsRef = useRef<ScrollMetrics>({
    contentHeight: 0,
    layoutHeight: 0,
    scrollY: 0,
  });
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  const updateFades = useCallback(() => {
    const { contentHeight, layoutHeight, scrollY } = metricsRef.current;
    const canScroll = contentHeight > layoutHeight + SCROLL_EDGE_THRESHOLD;

    setShowTopFade(canScroll && scrollY > SCROLL_EDGE_THRESHOLD);
    setShowBottomFade(
      canScroll && scrollY + layoutHeight < contentHeight - SCROLL_EDGE_THRESHOLD,
    );
  }, []);

  if (!isValidElement(children)) {
    return children;
  }

  const {
    onScroll: childOnScroll,
    onContentSizeChange: childOnContentSizeChange,
    onLayout: childOnLayout,
    scrollEventThrottle: childScrollEventThrottle,
  } = children.props;

  const scrollView = cloneElement(children, {
    scrollEventThrottle: childScrollEventThrottle ?? 16,
    onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      metricsRef.current.scrollY = event.nativeEvent.contentOffset.y;
      updateFades();
      childOnScroll?.(event);
    },
    onContentSizeChange: (width: number, height: number) => {
      metricsRef.current.contentHeight = height;
      updateFades();
      childOnContentSizeChange?.(width, height);
    },
    onLayout: (event: LayoutChangeEvent) => {
      metricsRef.current.layoutHeight = event.nativeEvent.layout.height;
      updateFades();
      childOnLayout?.(event);
    },
  });

  return (
    <View style={{ flex: 1, minHeight: 0 }}>
      {scrollView}
      {showTopFade ? (
        <LinearGradient
          pointerEvents="none"
          colors={[edgeColor, "transparent"]}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: fadeHeight,
          }}
        />
      ) : null}
      {showBottomFade ? (
        <LinearGradient
          pointerEvents="none"
          colors={["transparent", edgeColor]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: fadeHeight,
          }}
        />
      ) : null}
    </View>
  );
}
