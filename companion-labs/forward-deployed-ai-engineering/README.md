# Forward Deployed AI Engineering companion lab

This versioned source bundle is the reversible local-lab seam selected during Gate A. It keeps the companion runtime separate from the Academy web application and uses only synthetic HarbourCare data.

## B4 bootstrap contract

Node.js 24 is the only runtime required for the bootstrap commands. The canonical `fixture` profile performs no network request, opens no listening port, loads no production credential, and requires neither a paid provider nor a GPU.

```bash
node scripts/lab-bootstrap.mjs setup --profile fixture
node scripts/lab-bootstrap.mjs health --profile fixture
node scripts/lab-bootstrap.mjs reset --profile fixture
```

The default state directory is `.lab-state/`. `setup` is idempotent and authenticates the selected profile, fixture, and evidence manifest by SHA-256. `health` fails if those identities drift. `reset` deletes only a directory carrying the matching course/profile marker; it refuses unmarked state.

`cpu-low-resource` records the later CPU-only inference seam:

```bash
node scripts/lab-bootstrap.mjs setup --profile cpu-low-resource
node scripts/lab-bootstrap.mjs health --profile cpu-low-resource
node scripts/lab-bootstrap.mjs reset --profile cpu-low-resource
```

That profile caps the declared baseline at one worker and 1,024 MB, denies egress, and permits only an optional loopback model runtime. B4 does **not** claim that inference or evaluation has run; those exercises and their comparable quality, latency, throughput, and resource evidence belong to later module and clean-room gates. GPU and hosted-model work remain optional extensions and cannot replace deterministic evidence.

## Fail-closed boundaries

- Provider credential variables cause setup and health to stop before writing state.
- Fixture and evidence paths must resolve to regular files inside this bundle; traversal and symlinks are rejected.
- Service declarations bind to `none` or `127.0.0.1`; the canonical profile binds nothing.
- No container image, model weight, prepared database, customer record, provider response, or secret is included.
- `.lab-state/` is generated local state and must not be committed as evidence.

Use `data/` for the versioned synthetic fixture and `evidence/` for the evidence repository contract. Later slices may add services behind these profiles without changing the Academy application runtime.
