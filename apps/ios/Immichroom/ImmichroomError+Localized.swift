import Foundation

extension ImmichroomError: LocalizedError {
    public var errorDescription: String? {
        switch self {
        case .Message(let msg):
            return msg
        }
    }
}
