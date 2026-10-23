import SwiftUI

enum IRTheme {
    static let bgTop = Color(red: 0.07, green: 0.08, blue: 0.09)
    static let bgBottom = Color(red: 0.12, green: 0.10, blue: 0.08)
    static let accent = Color(red: 0.92, green: 0.72, blue: 0.38)
    static let ink = Color(red: 0.96, green: 0.94, blue: 0.90)
    static let muted = Color(red: 0.62, green: 0.58, blue: 0.52)

    static var background: some View {
        LinearGradient(
            colors: [bgTop, bgBottom],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
        .ignoresSafeArea()
    }
}
