#import <React/RCTBridgeModule.h>

/**
 * Rescaling and re-encoding a JPEG, which JavaScript cannot do on its own.
 *
 * SkyMatch needs two sizes of the same photo: a thumbnail everybody nearby
 * receives, and a portrait only the person who opens your card asks for.
 * The image picker returns one size per pick, and asking someone to choose
 * the same photo twice is not an option, so the second size is made here.
 */
@interface SkyMatchImage : NSObject <RCTBridgeModule>
@end
