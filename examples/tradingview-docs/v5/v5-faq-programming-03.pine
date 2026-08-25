//@version=5
indicator("Object demo")

// Define a new type named `pivot`.
type pivot
    int   x
    float y
    bool  isHigh

// Create a new `pivot` with specific values.
pivot newPivot = pivot.new(bar_index, close, true)

// Plot the `y` component of `newPivot`.
plot(newPivot.y)