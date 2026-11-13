export function pending<T>(source: () => Promise<T> | T, initial: T) {
	let value = $state.raw(initial);
	let loading = $state(true);

	$effect(() => {
		let active = true;
		loading = true;

		Promise.resolve(source()).then(
			(result) => {
				if (!active) return;
				value = result;
				loading = false;
			},
			() => {
				if (active) loading = false;
			}
		);

		return () => {
			active = false;
		};
	});

	return {
		get value() {
			return value;
		},
		get loading() {
			return loading;
		}
	};
}
